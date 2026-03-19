const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },

    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },

    /*
     * FIX 1: mobile is no longer `required` for OAuth users.
     * `sparse: true` allows multiple documents to have null/undefined
     * while still enforcing uniqueness among those who DO have a mobile.
     */
    mobile:   { type: String, default: null, unique: true, sparse: true, trim: true },

    /*
     * FIX 2: password is no longer `required` at the schema level.
     * Google OAuth users have no real password — we guard this in
     * application logic instead (register route still requires it).
     * The `minlength` validator only fires when a value is present.
     */
    password: { type: String, minlength: 8, select: false, default: null },

    pincode:  { type: String, default: "", trim: true },
    address:  { type: String, default: "", trim: true },
    dob:      { type: String, default: "" },
    gender:   { type: String, default: "" },
    role:     { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    isActive: { type: Boolean, default: true },
    lastLogin:{ type: Date },

    /*
     * FIX 3: googleId already had sparse: true — good.
     * Keeping it, just making the intent explicit.
     */
    googleId: { type: String, default: null, unique: true, sparse: true },
    avatar:   { type: String, default: null },
  },
  { timestamps: true }
);

/*
 * Hash password before save.
 * Guard: only hash if password exists and was modified.
 * This safely skips OAuth users who have null password.
 */
userSchema.pre("save", async function (next) {
  if (!this.password)              return next(); // OAuth user — skip
  if (!this.isModified("password")) return next(); // unchanged — skip
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/*
 * comparePassword: safe for OAuth users — returns false if no password set.
 */
userSchema.methods.comparePassword = function (plain) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);