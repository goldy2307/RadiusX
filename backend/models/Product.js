const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    seller:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name:          { type: String, required: true, trim: true },
    description:   { type: String, required: true, trim: true },
    category:      {
      type: String,
      enum: ["electronics", "fashion", "home", "food", "health", "sports", "books", "toys", "auto", "other"],
      required: true,
      index: true,
    },
    price:         { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    stock:         { type: Number, required: true, min: 0, default: 0 },
    images:        [{ type: String }],   // array of filenames / URLs
    pincode:       { type: String, required: true, trim: true, index: true },
    isActive:      { type: Boolean, default: true, index: true },
    rating:        { type: Number, default: 0, min: 0, max: 5 },
    reviews:       { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Full-text search index on name + description
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);