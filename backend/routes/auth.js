const express     = require("express");
const router      = express.Router();
const User        = require("../models/User");
const verifyToken = require("../middleware/auth");
const { registerRules, loginRules, handleValidation } = require("../middleware/validate");
const { signAccess, signRefresh, verifyRefresh, revokeRefresh, revokeAllForUser } = require("../services/authService");
const { sendWelcome } = require("../services/notifyService");

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// -- POST /auth/register ----------------------------------------
router.post("/register", registerRules, handleValidation, async (req, res) => {
  try {
    const { name, email, mobile, password, pincode, address } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) {
      const field = exists.email === email ? "email" : "mobile";
      return res.status(409).json({ success: false, message: `An account with this ${field} already exists` });
    }

    const user = await User.create({ name, email, mobile, password, pincode, address, role: "buyer" });

    const { token: accessToken }            = signAccess(user);
    const { token: refreshToken, expiresAt } = await signRefresh(user, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);
    sendWelcome(user).catch(() => {}); // fire-and-forget

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

// -- POST /auth/login ------------------------------------------
router.post("/login", loginRules, handleValidation, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Allow login by email OR mobile
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    }).select("+password"); // password excluded by default in toJSON but we need it here

    // Use a Mongoose document with the real password field
    const rawUser = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    });

    if (!rawUser) {
      return res.status(401).json({ success: false, message: "Incorrect credentials" });
    }

    const match = await rawUser.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Incorrect credentials" });
    }

    if (!rawUser.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    rawUser.lastLogin = new Date();
    await rawUser.save();

    const { token: accessToken }  = signAccess(rawUser);
    const { token: refreshToken } = await signRefresh(rawUser, {
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.cookie("refresh_token", refreshToken, COOKIE_OPTS);

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: rawUser.toJSON(),
    });
  } catch (err) {
    console.error("[POST /auth/login]", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// -- POST /auth/refresh -----------------------------------------
// Called silently by frontend to get a new access token
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    const { decoded, record } = await verifyRefresh(token);

    // Rotate: revoke old refresh token, issue new pair
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
    // Invalid / expired refresh token -- clear the cookie
    res.clearCookie("refresh_token");
    return res.status(401).json({ success: false, message: err.message });
  }
});

// -- POST /auth/logout ------------------------------------------
router.post("/logout", verifyToken, async (req, res) => {
  try {
    const token = req.cookies && req.cookies.refresh_token;
    if (token) {
      try {
        const { record } = await verifyRefresh(token);
        await revokeRefresh(record.jti);
      } catch (_) { /* already expired or invalid -- ignore */ }
    }
    res.clearCookie("refresh_token");
    return res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("[POST /auth/logout]", err);
    res.status(500).json({ success: false, message: "Logout error" });
  }
});

// -- GET /auth/me -----------------------------------------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error("[GET /auth/me]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- POST /auth/logout-all -------------------------------------
// Revoke every refresh token for this user (e.g. after password change)
router.post("/logout-all", verifyToken, async (req, res) => {
  try {
    await revokeAllForUser(req.user.id);
    res.clearCookie("refresh_token");
    return res.json({ success: true, message: "All sessions logged out" });
  } catch (err) {
    console.error("[POST /auth/logout-all]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;