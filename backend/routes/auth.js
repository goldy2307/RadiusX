const express     = require("express");
const router      = express.Router();
const passport    = require("passport");
const User        = require("../models/User");
const verifyToken = require("../middleware/auth");
const { registerRules, loginRules, handleValidation } = require("../middleware/validate");
const { signAccess, signRefresh, verifyRefresh, revokeRefresh, revokeAllForUser } = require("../services/authService");
const { sendWelcome, sendPasswordChanged, sendLoginAlert, send } = require("../services/notifyService");
const crypto = require("crypto");

/* In-memory OTP store — { email -> { otp, expires, verified, resetToken, userId } }
   Replace with Redis for production multi-instance deployments */
const otpStore = new Map();

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

/* ================================================================
   POST /auth/register
   ================================================================ */
router.post("/register", registerRules, handleValidation, async (req, res) => {
  try {
    const { name, email, mobile, password, pincode, address } = req.body;

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? "email" : "mobile";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
        errors: [{ field, message: `This ${field} is already registered` }],
      });
    }

    const user = await User.create({ name, email, mobile, password, pincode, address, role: "buyer" });

    const { token: accessToken }             = signAccess(user);
    const { token: refreshToken }            = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);
    sendWelcome(user).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("[POST /auth/register]", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/* ================================================================
   POST /auth/login
   FIX: Use .select("+password") to actually get the hashed password
   ================================================================ */
router.post("/login", loginRules, handleValidation, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    /* FIXED: single query with .select("+password") so comparePassword works */
    const user = await User.findOne({
      $or: [
        { email:  identifier.toLowerCase() },
        { mobile: identifier },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Incorrect credentials" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Incorrect credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    user.lastLogin = new Date();
    await user.save();

    const { token: accessToken }  = signAccess(user);
    const { token: refreshToken } = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);

    /* Send login alert email (fire and forget) */
    sendLoginAlert(user, {
      method:    "Email/Password",
      userAgent: req.headers["user-agent"] || "Unknown",
    }).catch(() => {});

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("[POST /auth/login]", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

/* ================================================================
   POST /auth/refresh
   ================================================================ */
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    const { decoded, record } = await verifyRefresh(token);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or disabled" });
    }

    /* Issue a new access token.
       We do NOT rotate the refresh token on every call — doing so causes a race
       condition when the user navigates pages quickly (each page calls /refresh,
       the first rotation revokes the token before the next page can use it).
       Refresh token rotation only happens on explicit logout + re-login. */
    const { token: newAccessToken } = signAccess(user);

    return res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    res.clearCookie("refresh_token");
    return res.status(401).json({ success: false, message: err.message });
  }
});

/* ================================================================
   POST /auth/logout
   ================================================================ */
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (token) {
      try {
        const { record } = await verifyRefresh(token);
        await revokeRefresh(record.jti);
      } catch (_) {}
    }
    res.clearCookie("refresh_token");
    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout error" });
  }
});

/* ================================================================
   GET /auth/me
   ================================================================ */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================================================================
   PUT /auth/profile  — update name/mobile/address/pincode/dob/gender
   ================================================================ */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, mobile, address, pincode, dob, gender } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    /* Check mobile uniqueness if changed */
    if (mobile) {
      const exists = await User.findOne({ mobile, _id: { $ne: req.user.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: "This mobile number is already registered" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: name.trim(), mobile, address, pincode, dob, gender } },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, message: "Profile updated", user: user.toJSON() });
  } catch (err) {
    console.error("[PUT /auth/profile]", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

/* ================================================================
   POST /auth/change-password
   ================================================================ */
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    /* Revoke all other sessions for security */
    await revokeAllForUser(user._id);

    /* Issue fresh tokens */
    const { token: accessToken }  = signAccess(user);
    const { token: refreshToken } = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });
    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);

    sendPasswordChanged(user).catch(() => {});

    return res.json({ success: true, message: "Password updated. Please log in again on other devices.", accessToken });
  } catch (err) {
    console.error("[POST /auth/change-password]", err);
    res.status(500).json({ success: false, message: "Password change failed" });
  }
});

/* ================================================================
   POST /auth/logout-all
   ================================================================ */
router.post("/logout-all", verifyToken, async (req, res) => {
  try {
    await revokeAllForUser(req.user.id);
    res.clearCookie("refresh_token");
    return res.json({ success: true, message: "All sessions logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================================================================
   GOOGLE OAUTH
   GET /auth/google          — start OAuth flow
   GET /auth/google/callback — Google redirects here after auth
   ================================================================ */

/* HARDCODED for local dev: http://localhost:3000/frontend
   Change this to your GitHub Pages URL before deploying:
   e.g. https://goldy2307.github.io/RadiusX/frontend           */
var FRONTEND_URL = "http://localhost:3000/frontend";

router.get("/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "placeholder") {
      return res.status(503).json({ success: false, message: "Google OAuth not configured" });
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err) {
      console.error("[Google OAuth] Strategy error:", err.message);
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }
    if (!user) {
      console.warn("[Google OAuth] Auth failed:", info);
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }
    try {
      const { token: accessToken }  = signAccess(user);
      const { token: refreshToken } = await signRefresh(user, {
        userAgent: req.headers["user-agent"],
        ip:        req.ip,
      });
      res.cookie("refresh_token", refreshToken, COOKIE_OPTS);
      console.log("[Google OAuth] Success for", user.email, "role:", user.role);
      return res.redirect(
        FRONTEND_URL + "/login.html?oauth_token=" + accessToken + "&role=" + user.role
      );
    } catch (tokenErr) {
      console.error("[Google OAuth] Token issue:", tokenErr.message);
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }
  })(req, res, next);
});

router.get("/google/failed", (req, res) => {
  res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
});

/* ================================================================
   POST /auth/forgot-password — send OTP to email
   ================================================================ */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If an account exists, a reset code has been sent." });

    const otp     = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000;
    otpStore.set(email.toLowerCase(), { otp, expires, verified: false, userId: user._id, resetToken: null });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:0;background:#0a0e12;font-family:Arial,sans-serif;}
.wrap{max-width:500px;margin:40px auto;background:#0e1216;border:1px solid #232f3a;border-radius:12px;overflow:hidden;}
.hd{padding:22px 32px;background:#0b1117;border-bottom:1px solid #1c2830;}
.logo{color:#c4df9a;font-size:20px;font-weight:700;}
.bd{padding:28px 32px;}
h2{color:#c4df9a;font-size:20px;margin:0 0 12px;}
p{color:#b0bac4;font-size:14px;line-height:1.7;margin:0 0 14px;}
.otp-box{background:#111820;border:2px solid #c4df9a;border-radius:10px;padding:20px;text-align:center;margin:20px 0;}
.otp{font-size:38px;font-weight:700;color:#c4df9a;letter-spacing:10px;}
.note{font-size:12px;color:#6a7a8a;margin-top:8px;}
.ft{padding:14px 32px;border-top:1px solid #1c2830;font-size:12px;color:#4a5a6a;text-align:center;}
</style></head><body><div class="wrap">
<div class="hd"><span class="logo">RadiusX</span></div>
<div class="bd">
<h2>Password Reset Code</h2>
<p>Hi <strong style="color:#dde5ec">${user.name}</strong>, here is your OTP to reset your password. It expires in <strong style="color:#c4df9a">10 minutes</strong>.</p>
<div class="otp-box"><div class="otp">${otp}</div><div class="note">Do not share this code with anyone.</div></div>
<p style="font-size:12px;color:#6a7a8a">If you didn't request this, ignore this email.</p>
</div><div class="ft">RadiusX &mdash; Your neighbourhood marketplace</div>
</div></body></html>`;

    await send({ to: user.email, subject: `${otp} — your RadiusX password reset code`, html });
    console.log("[ForgotPassword] OTP sent to", user.email);
    return res.json({ success: true, message: "Reset code sent to your email." });
  } catch (err) {
    console.error("[POST /auth/forgot-password]", err);
    res.status(500).json({ success: false, message: "Could not send reset code" });
  }
});

/* ================================================================
   POST /auth/verify-otp
   ================================================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const record = otpStore.get(email.toLowerCase());
    if (!record)                          return res.status(400).json({ success: false, message: "No reset request found. Request a new code." });
    if (Date.now() > record.expires)    { otpStore.delete(email.toLowerCase()); return res.status(400).json({ success: false, message: "OTP expired. Request a new one." }); }
    if (record.otp !== String(otp).trim()) return res.status(400).json({ success: false, message: "Incorrect OTP." });

    record.verified   = true;
    record.resetToken = crypto.randomBytes(32).toString("hex");
    otpStore.set(email.toLowerCase(), record);

    return res.json({ success: true, message: "OTP verified.", resetToken: record.resetToken });
  } catch (err) {
    console.error("[POST /auth/verify-otp]", err);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
});

/* ================================================================
   POST /auth/reset-password
   ================================================================ */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) return res.status(400).json({ success: false, message: "All fields required" });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

    const record = otpStore.get(email.toLowerCase());
    if (!record || !record.verified)       return res.status(400).json({ success: false, message: "Please verify OTP first" });
    if (record.resetToken !== resetToken)  return res.status(400).json({ success: false, message: "Invalid reset token" });
    if (Date.now() > record.expires + 5 * 60 * 1000) { otpStore.delete(email.toLowerCase()); return res.status(400).json({ success: false, message: "Session expired. Start over." }); }

    const user = await User.findById(record.userId).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = newPassword;
    await user.save();
    otpStore.delete(email.toLowerCase());

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:0;background:#0a0e12;font-family:Arial,sans-serif;}
.wrap{max-width:500px;margin:40px auto;background:#0e1216;border:1px solid #232f3a;border-radius:12px;overflow:hidden;}
.hd{padding:22px 32px;background:#0b1117;border-bottom:1px solid #1c2830;}
.logo{color:#c4df9a;font-size:20px;font-weight:700;}
.bd{padding:28px 32px;}
h2{color:#c4df9a;font-size:20px;margin:0 0 12px;}
p{color:#b0bac4;font-size:14px;line-height:1.7;margin:0 0 14px;}
.btn{display:inline-block;padding:12px 28px;background:#c4df9a;color:#08100a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;}
.ft{padding:14px 32px;border-top:1px solid #1c2830;font-size:12px;color:#4a5a6a;text-align:center;}
</style></head><body><div class="wrap">
<div class="hd"><span class="logo">RadiusX</span></div>
<div class="bd">
<h2>Password Reset Successful &#128274;</h2>
<p>Hi <strong style="color:#dde5ec">${user.name}</strong>,</p>
<p>Your password was reset on <strong style="color:#c4df9a">${new Date().toLocaleString("en-IN")}</strong>. If this wasn't you, contact support immediately.</p>
<a href="${process.env.CLIENT_URL || "http://localhost:3000"}/frontend/login.html" class="btn">Sign In Now</a>
</div><div class="ft">RadiusX &mdash; Your neighbourhood marketplace</div>
</div></body></html>`;

    await send({ to: user.email, subject: "Your RadiusX password has been reset", html });
    console.log("[ResetPassword] Password reset for", user.email);
    return res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.error("[POST /auth/reset-password]", err);
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
});

module.exports = router;