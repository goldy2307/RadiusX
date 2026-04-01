const express     = require("express");
const router      = express.Router();
const bcrypt      = require("bcryptjs");
const User        = require("../models/User");
const Seller      = require("../models/Seller");
const Product     = require("../models/Product");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/role");
const { approveRejectRules, handleValidation } = require("../middleware/validate");
const { sendSellerApproved, sendSellerRejected } = require("../services/notifyService");

// All admin routes require valid JWT + admin role
router.use(verifyToken, requireRole("admin"));

// -- GET /admin/stats -------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      rejectedSellers,
      totalProducts,
      activeProducts,
    ] = await Promise.all([
      User.countDocuments({ role: "buyer" }),
      Seller.countDocuments(),
      Seller.countDocuments({ status: "pending" }),
      Seller.countDocuments({ status: "approved" }),
      Seller.countDocuments({ status: "rejected" }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        pendingSellers,
        approvedSellers,
        rejectedSellers,
        totalProducts,
        activeProducts,
      },
    });
  } catch (err) {
    console.error("[GET /admin/stats]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /admin/sellers -----------------------------------------
// ?status=pending|approved|rejected &page= &limit= &search=
router.get("/sellers", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit  = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const re = new RegExp(req.query.search, "i");
      filter.$or = [{ ownerName: re }, { storeName: re }, { email: re }, { bizName: re }];
    }

    const [sellers, total] = await Promise.all([
      Seller.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .populate("reviewedBy", "name"),
      Seller.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      sellers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /admin/sellers]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /admin/sellers/:id -------------------------------------
router.get("/sellers/:id", async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .populate("user", "name email role")
      .populate("reviewedBy", "name");
    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    return res.json({ success: true, seller });
  } catch (err) {
    console.error("[GET /admin/sellers/:id]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- PATCH /admin/sellers/:id/review ---------------------------
// { status: "approved" | "rejected", adminNote: "..." }
router.patch("/sellers/:id/review", approveRejectRules, handleValidation, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const seller = await Seller.findById(req.params.id);

    if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });
    if (seller.status !== "pending") {
      return res.status(409).json({ success: false, message: "Application already reviewed" });
    }

    seller.status     = status;
    seller.adminNote  = adminNote || "";
    seller.reviewedBy = req.user.id;
    seller.reviewedAt = new Date();

    if (status === "approved") {
      // Check if a User account already exists for this email
      let user = await User.findOne({ email: seller.email });

      if (!user) {
        // Create a new User account for the seller
        // Password was hashed and stored in the Seller doc when they applied
        user = await User.create({
          name:     seller.ownerName,
          email:    seller.email,
          mobile:   seller.mobile,
          password: seller.passwordHash, // already bcrypt-hashed -- skip the pre-save hook
          pincode:  seller.pincode,
          address:  seller.storeAddr,
          role:     "seller",
        });
        // Skip pre-save password hashing for this one (password is already hashed)
        // We do a direct update to avoid double-hashing
        await User.updateOne({ _id: user._id }, { password: seller.passwordHash });
      } else {
        // Upgrade existing user to seller role
        user.role = "seller";
        await user.save();
      }

      seller.user = user._id;
      sendSellerApproved(seller).catch(() => {});

    } else {
      sendSellerRejected(seller, adminNote).catch(() => {});
    }

    await seller.save();

    return res.json({
      success: true,
      message: status === "approved" ? "Seller approved and account created" : "Seller rejected",
      seller,
    });
  } catch (err) {
    console.error("[PATCH /admin/sellers/:id/review]", err);
    res.status(500).json({ success: false, message: "Review action failed" });
  }
});

// -- GET /admin/users -------------------------------------------
// ?role= &page= &limit= &search=
router.get("/users", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit  = Math.min(100, parseInt(req.query.limit || "30", 10));
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.role)   filter.role     = req.query.role;
    if (req.query.search) {
      const re = new RegExp(req.query.search, "i");
      filter.$or = [{ name: re }, { email: re }, { mobile: re }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /admin/users]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- PATCH /admin/users/:id/toggle -----------------------------
// Enable / disable any user account
router.patch("/users/:id/toggle", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot disable your own account" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      [{ $set: { isActive: { $not: "$isActive" } } }],
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({
      success: true,
      message: user.isActive ? "User enabled" : "User disabled",
      isActive: user.isActive,
    });
  } catch (err) {
    console.error("[PATCH /admin/users/:id/toggle]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /admin/products ----------------------------------------
// ?seller= &category= &page= &limit=
router.get("/products", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit  = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.seller)   filter.seller   = req.query.seller;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.active !== undefined) filter.isActive = req.query.active === "true";

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "name email"),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /admin/products]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================================================================
   GET /admin/orders — all orders with user info (admin only)
   ================================================================ */
router.get("/orders", async (req, res) => {
  try {
    const Order = require("../models/Order");
    const page   = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit  = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user)   filter.user   = req.query.user;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email mobile"),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /admin/orders]", err);
    res.status(500).json({ success: false, message: "Could not fetch orders" });
  }
});

/* ================================================================
   PATCH /admin/orders/:id/status — update any order's status
   ================================================================ */
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const Order = require("../models/Order");
    const { sendOrderStatusUpdate } = require("../services/notifyService");
    const { status, trackingId } = req.body;
    const validStatuses = ["processing", "shipped", "delivered", "cancelled", "returned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status, ...(trackingId && { trackingId }) } },
      { new: true }
    ).populate("user", "name email");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.user) sendOrderStatusUpdate(order.user, order).catch(() => {});

    return res.json({ success: true, message: "Status updated", order });
  } catch (err) {
    console.error("[PATCH /admin/orders/:id/status]", err);
    res.status(500).json({ success: false, message: "Could not update status" });
  }
});

/* ================================================================
   GET /admin/users/:id — single user detail + their orders
   ================================================================ */
router.get("/users/:id", async (req, res) => {
  try {
    const Order = require("../models/Order");
    const [user, orders] = await Promise.all([
      User.findById(req.params.id),
      Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(20),
    ]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user, orders });
  } catch (err) {
    console.error("[GET /admin/users/:id]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================================================================
   POST /admin/broadcast — send email to all users / sellers / both
   ================================================================ */
router.post("/broadcast", async (req, res) => {
  try {
    const { target, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    const { send } = require("../services/notifyService");
    const filter = {};
    if (target === "buyers")  filter.role = "buyer";
    if (target === "sellers") filter.role = "seller";

    const users = await User.find(filter).select("name email");
    if (!users.length) {
      return res.json({ success: true, message: "No recipients found", sent: 0 });
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:0;background:#0a0e12;font-family:Arial,sans-serif;}
.wrap{max-width:520px;margin:40px auto;background:#0e1216;border:1px solid #232f3a;border-radius:12px;overflow:hidden;}
.hd{padding:22px 32px;background:#0b1117;border-bottom:1px solid #1c2830;}
.logo{color:#c4df9a;font-size:20px;font-weight:700;}
.bd{padding:28px 32px;}
h2{color:#c4df9a;font-size:20px;margin:0 0 16px;}
p{color:#b0bac4;font-size:14px;line-height:1.8;margin:0 0 12px;white-space:pre-wrap;}
.ft{padding:14px 32px;border-top:1px solid #1c2830;font-size:12px;color:#4a5a6a;text-align:center;}
</style></head><body><div class="wrap">
<div class="hd"><span class="logo">RadiusX</span></div>
<div class="bd"><h2>${subject}</h2><p>${message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p></div>
<div class="ft">RadiusX Admin &mdash; This is an official platform notice</div>
</div></body></html>`;

    /* Send in batches of 10 to avoid overwhelming SMTP */
    let sent = 0;
    for (const u of users) {
      try {
        await send({ to: u.email, subject, html });
        sent++;
      } catch(e) {
        console.error("[Broadcast] Failed for", u.email, e.message);
      }
    }

    console.log("[Broadcast] Sent to", sent, "of", users.length, "recipients");
    return res.json({ success: true, message: `Broadcast sent to ${sent} recipients.`, sent });
  } catch (err) {
    console.error("[POST /admin/broadcast]", err);
    res.status(500).json({ success: false, message: "Broadcast failed" });
  }
});

module.exports = router;