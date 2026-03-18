const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile:   { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    pincode:  { type: String, required: true, trim: true },
    address:  { type: String, required: true, trim: true },
    role:     { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    isActive: { type: Boolean, default: true },
    lastLogin:{ type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);