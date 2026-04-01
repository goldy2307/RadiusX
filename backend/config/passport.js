/* ================================================================
   config/passport.js — Google OAuth strategy
   ================================================================ */

const passport = require("passport");

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "placeholder" &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== "placeholder"
) {
  const GoogleStrategy  = require("passport-google-oauth20").Strategy;
  const User            = require("../models/User");
  const crypto          = require("crypto");
  const { sendWelcome } = require("../services/notifyService");

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                      "http://localhost:5000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email    = profile.emails && profile.emails[0] && profile.emails[0].value;
          const name     = profile.displayName || "Google User";
          const googleId = profile.id;
          const avatar   = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          if (!email) {
            return done(new Error("Google account has no email address"), null);
          }

          /* ── 1. Already linked by googleId ── */
          let user = await User.findOne({ googleId });
          if (user) {
            console.log("[Google OAuth] Existing Google user:", email);
            return done(null, user);
          }

          /* ── 2. Account exists with same email — link Google to it ── */
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            console.log("[Google OAuth] Linking Google to existing account:", email);
            /* Use updateOne to avoid triggering password validation on save */
            await User.updateOne(
              { _id: user._id },
              { $set: { googleId, avatar: user.avatar || avatar } }
            );
            /* Reload fresh user after update */
            user = await User.findById(user._id);
            return done(null, user);
          }

          /* ── 3. Brand new user via Google ── */
          console.log("[Google OAuth] Creating new user:", email);

          /* Generate unique mobile placeholder using googleId (always 21 chars, unique per Google account) */
          const uniqueMobile = "g" + googleId;

          /* Generate a strong random password — user cannot use it, they must use Google to login */
          const randomPassword = crypto.randomBytes(32).toString("hex");

          user = await User.create({
            name,
            email:    email.toLowerCase(),
            mobile:   uniqueMobile,
            password: randomPassword,
            pincode:  "000000",
            address:  "Please update via Profile",
            role:     "buyer",
            googleId,
            avatar,
          });

          console.log("[Google OAuth] New user created:", email);
          sendWelcome(user).catch(() => {});
          return done(null, user);

        } catch (err) {
          console.error("[Google OAuth Strategy] Error:", err.message);
          /* Log the full error for debugging */
          if (err.code === 11000) {
            console.error("[Google OAuth Strategy] Duplicate key:", JSON.stringify(err.keyValue));
          }
          return done(err, null);
        }
      }
    )
  );
  console.log("[Passport] Google OAuth strategy registered");
} else {
  console.log("[Passport] Google OAuth skipped — GOOGLE_CLIENT_ID/SECRET not set or placeholder");
}

module.exports = passport;