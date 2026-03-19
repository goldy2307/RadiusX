const express     = require("express");
const router      = express.Router();
const passport    = require("passport");
const User        = require("../models/User");
const verifyToken = require("../middleware/auth");
const { registerRules, loginRules, handleValidation } = require("../middleware/validate");
const { signAccess, signRefresh, verifyRefresh, revokeRefresh, revokeAllForUser } = require("../services/authService");
const { sendWelcome, sendPasswordChanged } = require("../services/notifyService");

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

/*
 * FIX: Read FRONTEND_URL from environment so you never have to touch
 * source code when deploying. Falls back to localhost for local dev.
 *
 * Set in .env:
 *   FRONTEND_URL=https://goldy2307.github.io/RadiusX/frontend
 */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000/frontend";

/* ================================================================
   POST /auth/register
   ================================================================ */
router.post("/register", registerRules, handleValidation, async (req, res) => {
  try {
    const { name, email, mobile, password, pincode, address } = req.body;

    /*
     * FIX: Since password is no longer `required` in the schema,
     * enforce it explicitly here for normal registrations.
     */
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
        errors: [{ field: "password", message: "Password must be at least 8 characters" }],
      });
    }

    const exists = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(mobile ? [{ mobile }] : []),
      ],
    });

    if (exists) {
      const field = exists.email === email.toLowerCase() ? "email" : "mobile";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
        errors: [{ field, message: `This ${field} is already registered` }],
      });
    }

    const user = await User.create({ name, email, mobile, password, pincode, address, role: "buyer" });

    const { token: accessToken }  = signAccess(user);
    const { token: refreshToken } = await signRefresh(user, {
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
   ================================================================ */
router.post("/login", loginRules, handleValidation, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email:  identifier.toLowerCase() },
        { mobile: identifier },
      ],
    }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Incorrect credentials" });
    }

    /*
     * FIX: If this is a Google-only account (no password set),
     * tell the user to sign in with Google instead of showing
     * a generic "incorrect credentials" error.
     */
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google. Please sign in with Google.",
      });
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
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    const { decoded, record } = await verifyRefresh(token);
    await revokeRefresh(record.jti);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or disabled" });
    }

    const { token: newAccessToken }  = signAccess(user);
    const { token: newRefreshToken } = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.cookie("refresh_token", newRefreshToken, COOKIE_OPTS);
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
    const token = req.cookies?.refresh_token;
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
   PUT /auth/profile  — update name / mobile / address / pincode / dob / gender
   ================================================================ */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, mobile, address, pincode, dob, gender } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

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

    /*
     * FIX: Google-only accounts have no password — block this endpoint for them.
     */
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Set a password via the forgot-password flow instead.",
      });
    }

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    await revokeAllForUser(user._id);

    const { token: accessToken }  = signAccess(user);
    const { token: refreshToken } = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });
    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);

    sendPasswordChanged(user).catch(() => {});

    return res.json({
      success: true,
      message: "Password updated. Please log in again on other devices.",
      accessToken,
    });
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

router.get("/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "placeholder") {
      return res.status(503).json({ success: false, message: "Google OAuth not configured" });
    }
    next();
  },
  passport.authenticate("google", {
    scope:   ["profile", "email"],
    session: false,
    prompt:  "select_account",
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {

    if (err) {
      /* FIX: Log full error so you can diagnose in server console */
      console.error("[Google OAuth] Strategy error:", err);
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }

    if (!user) {
      console.warn("[Google OAuth] No user returned. Info:", JSON.stringify(info));
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }

    try {
      const { token: accessToken }  = signAccess(user);
      const { token: refreshToken } = await signRefresh(user, {
        userAgent: req.headers["user-agent"],
        ip:        req.ip,
      });

      res.cookie("refresh_token", refreshToken, COOKIE_OPTS);
      console.log("[Google OAuth] Success for", user.email, "| role:", user.role);

      return res.redirect(
        `${FRONTEND_URL}/login.html?oauth_token=${accessToken}&role=${user.role}`
      );
    } catch (tokenErr) {
      console.error("[Google OAuth] Token error:", tokenErr);
      return res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
    }

  })(req, res, next);
});

router.get("/google/failed", (_req, res) => {
  res.redirect(FRONTEND_URL + "/login.html?oauth_error=1");
});

module.exports = router;