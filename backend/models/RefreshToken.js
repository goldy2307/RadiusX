const mongoose = require("mongoose");

// Stores the jti (JWT ID) of every issued refresh token so we can
// do server-side revocation even without Redis.
// If Redis IS available, we also blocklist there -- belt-and-suspenders.
const refreshTokenSchema = new mongoose.Schema(
  {
    jti:       { type: String, required: true, unique: true, index: true },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
    revoked:   { type: Boolean, default: false },
    userAgent: { type: String, default: "" },
    ip:        { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-delete expired tokens from the collection
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);