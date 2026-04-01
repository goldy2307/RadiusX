const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  /* product ref is optional — static catalogue items have no MongoDB _id */
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false, default: null },
  name:          { type: String, required: true },
  category:      { type: String, default: "other" },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  qty:           { type: Number, required: true, min: 1 },
  image:         { type: String, default: "" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items:          [orderItemSchema],
  status:         {
    type: String,
    enum: ["processing", "shipped", "delivered", "cancelled", "returned"],
    default: "processing",
    index: true,
  },
  deliveryCharge: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  couponCode:     { type: String, default: "" },
  address:        { type: String, default: "" },
  trackingId:     { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);