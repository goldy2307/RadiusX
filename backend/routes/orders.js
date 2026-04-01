const express    = require("express");
const router     = express.Router();
const Order      = require("../models/Order");
const verifyToken = require("../middleware/auth");
const { sendOrderPlaced, sendOrderStatusUpdate } = require("../services/notifyService");
const cartAbandonment = require("../services/cartAbandonmentService");

/* ================================================================
   GET /orders — get current user's orders
   ================================================================ */
router.get("/", verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, orders });
  } catch (err) {
    console.error("[GET /orders]", err);
    res.status(500).json({ success: false, message: "Could not fetch orders" });
  }
});

/* ================================================================
   GET /orders/:id — get single order
   ================================================================ */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch order" });
  }
});

/* ================================================================
   POST /orders — place a new order (checkout)
   ================================================================ */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { items, deliveryCharge, couponDiscount, couponCode, address } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const order = await Order.create({
      user:           req.user.id,
      items,
      deliveryCharge: deliveryCharge || 0,
      couponDiscount: couponDiscount || 0,
      couponCode:     couponCode     || "",
      address:        address        || "",
      status:         "processing",
    });

    /* Cancel cart abandonment timer — user completed checkout */
    cartAbandonment.cancel(req.user.id);

    /* Send order confirmation email */
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (user) sendOrderPlaced(user, order).catch(() => {});

    return res.status(201).json({ success: true, message: "Order placed!", order });
  } catch (err) {
    console.error("[POST /orders]", err);
    res.status(500).json({ success: false, message: "Could not place order" });
  }
});

/* ================================================================
   PATCH /orders/:id/status — update order status (seller/admin)
   ================================================================ */
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status, trackingId } = req.body;
    const validStatuses = ["processing", "shipped", "delivered", "cancelled", "returned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status, ...(trackingId && { trackingId }) } },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    /* Send status update email */
    const User = require("../models/User");
    const user = await User.findById(order.user);
    if (user) sendOrderStatusUpdate(user, order).catch(() => {});

    return res.json({ success: true, message: "Status updated", order });
  } catch (err) {
    console.error("[PATCH /orders/:id/status]", err);
    res.status(500).json({ success: false, message: "Could not update status" });
  }
});

/* ================================================================
   POST /orders/cart-activity — track cart for abandonment emails
   Call this from frontend whenever user updates their cart
   ================================================================ */
router.post("/cart-activity", verifyToken, async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (cartItems && cartItems.length > 0) {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      if (user) cartAbandonment.track(user, cartItems);
    } else {
      cartAbandonment.cancel(req.user.id);
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;