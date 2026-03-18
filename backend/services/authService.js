const jwt           = require("jsonwebtoken");
const crypto        = require("crypto");
const RefreshToken  = require("../models/RefreshToken");
const { blockToken } = require("../config/redis");

const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// -- Helper: parse duration string to seconds ------------------
function durationToSeconds(dur) {
  const unit = dur.slice(-1);
  const val  = parseInt(dur.slice(0, -1), 10);
  const map  = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * (map[unit] || 60);
}

// -- Issue a new access token (short-lived) --------------------
function signAccess(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, jti },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
  return { token, jti };
}

// -- Issue a new refresh token (long-lived, stored in DB) -------
async function signRefresh(user, meta = {}) {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + durationToSeconds(REFRESH_EXPIRES) * 1000);

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  // Persist to DB so we can revoke it later even without Redis
  await RefreshToken.create({
    jti,
    user: user._id,
    expiresAt,
    userAgent: meta.userAgent || "",
    ip:        meta.ip        || "",
  });

  return { token, jti, expiresAt };
}

// -- Verify a refresh token from the cookie --------------------
async function verifyRefresh(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new Error(e.name === "TokenExpiredError" ? "Refresh token expired" : "Invalid refresh token");
  }

  // Check DB record -- covers revoked / missing tokens
  const record = await RefreshToken.findOne({ jti: decoded.jti });
  if (!record)           throw new Error("Refresh token not found");
  if (record.revoked)    throw new Error("Refresh token has been revoked");
  if (record.expiresAt < new Date()) throw new Error("Refresh token expired");

  return { decoded, record };
}

// -- Revoke a refresh token (logout / token rotation) ----------
async function revokeRefresh(jti) {
  const record = await RefreshToken.findOneAndUpdate(
    { jti },
    { revoked: true },
    { new: true }
  );
  if (record) {
    const ttl = Math.floor((record.expiresAt - Date.now()) / 1000);
    if (ttl > 0) await blockToken(jti, ttl); // also add to Redis for fast checks
  }
}

// -- Revoke ALL refresh tokens for a user (e.g. password change) -
async function revokeAllForUser(userId) {
  const records = await RefreshToken.find({ user: userId, revoked: false });
  for (const r of records) {
    r.revoked = true;
    await r.save();
    const ttl = Math.floor((r.expiresAt - Date.now()) / 1000);
    if (ttl > 0) await blockToken(r.jti, ttl);
  }
}

module.exports = { signAccess, signRefresh, verifyRefresh, revokeRefresh, revokeAllForUser };