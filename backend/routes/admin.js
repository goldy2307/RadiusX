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

module.exports = router;