const express      = require("express");
const router       = express.Router();
const bcrypt       = require("bcryptjs");
const Seller       = require("../models/Seller");
const Product      = require("../models/Product");
const verifyToken  = require("../middleware/auth");
const requireRole  = require("../middleware/role");
const { sellerApplyRules, handleValidation } = require("../middleware/validate");
const { sendSellerReceived } = require("../services/notifyService");

// -- POST /seller/apply -----------------------------------------
// Public -- no auth required (the user might not have an account yet)
router.post("/apply", sellerApplyRules, handleValidation, async (req, res) => {
  try {
    const {
      ownerName, email, mobile, bizType, bizName, gst, pan,
      storeName, storeDesc, category, pincode, storeAddr, password,
      accName, bankName, accNo, ifsc,
    } = req.body;

    // Check for duplicate application
    const existing = await Seller.findOne({
      $or: [{ email }, { pan }],
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An application with this email or PAN already exists",
      });
    }

    // Hash password now -- will be transferred to User model on approval
    const passwordHash = await bcrypt.hash(password, 12);

    // Attach doc filenames if they were uploaded via multipart (optional)
    const docs = {
      pan:  req.body.docPAN  || "",
      gst:  req.body.docGST  || "",
      biz:  req.body.docBiz  || "",
      bank: req.body.docBank || "",
    };

    const seller = await Seller.create({
      ownerName, email, mobile, bizType, bizName, gst, pan,
      storeName, storeDesc, category, pincode, storeAddr, passwordHash,
      accName, bankName, accNo, ifsc, docs,
    });

    // Fire-and-forget confirmation email
    sendSellerReceived(seller).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. You'll receive an email within 24-48 hours.",
      applicationId: seller._id,
    });
  } catch (err) {
    console.error("[POST /seller/apply]", err);
    res.status(500).json({ success: false, message: "Application submission failed" });
  }
});

// -- GET /seller/status -----------------------------------------
// Check application status by email (called from seller dashboard pending screen)
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const seller = await Seller.findOne({ email: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .select("storeName status adminNote createdAt reviewedAt");

    if (!seller) return res.status(404).json({ success: false, message: "No application found" });

    return res.json({ success: true, application: seller });
  } catch (err) {
    console.error("[GET /seller/status]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /seller/me ---------------------------------------------
// Returns the seller record linked to the logged-in user
router.get("/me", verifyToken, requireRole("seller"), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(404).json({ success: false, message: "Seller record not found" });
    return res.json({ success: true, seller });
  } catch (err) {
    console.error("[GET /seller/me]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /seller/my-products ------------------------------------
router.get("/my-products", verifyToken, requireRole("seller"), async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const filter = { seller: req.user.id };
    if (req.query.active !== undefined) filter.isActive = req.query.active === "true";

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /seller/my-products]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- GET /seller/dashboard-stats --------------------------------
router.get("/dashboard-stats", verifyToken, requireRole("seller"), async (req, res) => {
  try {
    const sellerId = req.user.id;
    const [totalProducts, activeProducts, outOfStock] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, isActive: true }),
      Product.countDocuments({ seller: sellerId, stock: 0 }),
    ]);
    return res.json({
      success: true,
      stats: { totalProducts, activeProducts, outOfStock },
    });
  } catch (err) {
    console.error("[GET /seller/dashboard-stats]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;