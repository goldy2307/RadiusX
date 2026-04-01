const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile:   { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    pincode:  { type: String, default: "", trim: true },
    address:  { type: String, default: "", trim: true },
    dob:      { type: String, default: "" },
    gender:   { type: String, default: "" },
    role:     { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    isActive: { type: Boolean, default: true },
    lastLogin:{ type: Date },
    googleId: { type: String, default: null, sparse: true },
    avatar:   { type: String, default: null },
  },
  { timestamps: true }
);

/* Hash password before save — only when password field is actually modified */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  /* Don't re-hash if already hashed (bcrypt hashes start with $2) */
  if (this.password && this.password.startsWith("$2")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);