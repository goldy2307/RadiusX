/* ================================================================
   config/passport.js
   Google OAuth 2.0 strategy via passport-google-oauth20
   ================================================================ */

const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User           = require("../models/User");
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
        const email    = profile.emails?.[0]?.value;
        const name     = profile.displayName || "Google User";
        const googleId = profile.id;
        const avatar   = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("Google did not return an email address"), null);
        }

        /* ── 1. Already registered via Google ── */
        let user = await User.findOne({ googleId });

        /* ── 2. Registered with email+password before, link Google now ── */
        if (!user) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            user.googleId = googleId;
            user.avatar   = user.avatar || avatar;
            await user.save();
          }
        }

        /* ── 3. Brand-new user — create account ── */
        if (!user) {
          /*
           * FIX: Do NOT pass mobile/pincode placeholders.
           * mobile is now optional (sparse unique) in the schema,
           * so omitting it allows unlimited Google signups without
           * duplicate-key errors on the mobile field.
           *
           * password gets a random 64-char hex — unguessable, never
           * exposed. The schema no longer requires it (select: false).
           */
          user = await User.create({
            name,
            email:    email.toLowerCase(),
            password: require("crypto").randomBytes(32).toString("hex"),
            role:     "buyer",
            googleId,
            avatar,
            // mobile  → intentionally omitted (null by default)
            // pincode → defaults to "" in schema
            // address → defaults to "" in schema
          });

          /* Send welcome email — fire-and-forget */
          sendWelcome(user).catch((mailErr) => {
            console.warn("[Google OAuth] Welcome email failed:", mailErr.message);
          });
        }

        return done(null, user);

      } catch (err) {
        /*
         * FIX: Log the FULL error object so you can see the real cause
         * in your server console (e.g. duplicate key, validation error).
         */
        console.error("[Google OAuth Strategy] Full error:", err);
        return done(err, null);
      }
    }
  )
);

/* Serialize / deserialize are not used (session: false) but keeping
   stubs here avoids accidental issues if session is ever enabled. */
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;