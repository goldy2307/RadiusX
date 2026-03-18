const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    // Link to User account (created when seller is approved)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Step 1 — Business Info
    ownerName: { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    mobile:    { type: String, required: true, trim: true },
    bizType:   {
      type: String,
      enum: ["individual", "partnership", "pvt_ltd", "llp", "trust"],
      required: true,
    },
    bizName:   { type: String, required: true, trim: true },
    gst:       { type: String, trim: true, default: "" },
    pan:       { type: String, required: true, trim: true, uppercase: true },

    // Step 2 — Store Details
    storeName:  { type: String, required: true, trim: true },
    storeDesc:  { type: String, required: true, trim: true },
    category:   { type: String, required: true },
    pincode:    { type: String, required: true, trim: true },
    storeAddr:  { type: String, required: true, trim: true },
    // password stored in the linked User model once approved
    passwordHash: { type: String, required: true }, // bcrypt hash, stored temporarily

    // Step 3 — Bank & Docs
    accName:  { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accNo:    { type: String, required: true, trim: true },
    ifsc:     { type: String, required: true, trim: true, uppercase: true },
    docs: {
      pan:  { type: String, default: "" }, // filename / storage key
      gst:  { type: String, default: "" },
      biz:  { type: String, default: "" },
      bank: { type: String, default: "" },
    },

    // Application lifecycle
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote:   { type: String, default: "" },  // rejection reason
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);