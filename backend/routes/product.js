const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const path        = require("path");
const Product     = require("../models/Product");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/role");
const { productRules, handleValidation } = require("../middleware/validate");

// -- Image upload (local disk -- swap for S3/Cloudinary in production) --
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products/"),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = Date.now() + "-" + Math.round(Math.random() * 1e6) + ext;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpg|jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG, or WEBP images allowed"));
  },
});

// -- GET /products ----------------------------------------------
// Public -- supports: ?category= &pincode= &search= &page= &limit= &sort=
router.get("/", async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit    = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip     = (page - 1) * limit;
    const filter   = { isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.pincode)  filter.pincode  = req.query.pincode;

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const sortMap = {
      newest:     { createdAt: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
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
    console.error("[GET /products]", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

// -- GET /products/:id ------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "name email");
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, product });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    console.error("[GET /products/:id]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- POST /products ---------------------------------------------
// Seller only -- add a new product
router.post(
  "/",
  verifyToken,
  requireRole("seller"),
  upload.array("images", 5),
  productRules,
  handleValidation,
  async (req, res) => {
    try {
      const { name, description, category, price, originalPrice, stock, pincode } = req.body;
      const images = (req.files || []).map((f) => f.filename);

      const product = await Product.create({
        seller: req.user.id,
        name, description, category,
        price:         parseFloat(price),
        originalPrice: parseFloat(originalPrice),
        stock:         parseInt(stock, 10),
        pincode,
        images,
      });

      return res.status(201).json({ success: true, message: "Product added", product });
    } catch (err) {
      console.error("[POST /products]", err);
      res.status(500).json({ success: false, message: "Failed to add product" });
    }
  }
);

// -- PUT /products/:id ------------------------------------------
// Seller -- update own product only
router.put(
  "/:id",
  verifyToken,
  requireRole("seller", "admin"),
  upload.array("images", 5),
  productRules,
  handleValidation,
  async (req, res) => {
    try {
      const filter = { _id: req.params.id };
      if (req.user.role === "seller") filter.seller = req.user.id; // sellers can only edit their own

      const product = await Product.findOne(filter);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found or access denied" });
      }

      const { name, description, category, price, originalPrice, stock, pincode } = req.body;
      if (name)          product.name          = name;
      if (description)   product.description   = description;
      if (category)      product.category      = category;
      if (price)         product.price         = parseFloat(price);
      if (originalPrice) product.originalPrice = parseFloat(originalPrice);
      if (stock !== undefined) product.stock   = parseInt(stock, 10);
      if (pincode)       product.pincode       = pincode;
      if (req.files && req.files.length > 0) {
        product.images = req.files.map((f) => f.filename);
      }

      await product.save();
      return res.json({ success: true, message: "Product updated", product });
    } catch (err) {
      console.error("[PUT /products/:id]", err);
      res.status(500).json({ success: false, message: "Failed to update product" });
    }
  }
);

// -- PATCH /products/:id/toggle ---------------------------------
// Soft enable/disable a product
router.patch("/:id/toggle", verifyToken, requireRole("seller", "admin"), async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role === "seller") filter.seller = req.user.id;

    const product = await Product.findOneAndUpdate(
      filter,
      [{ $set: { isActive: { $not: "$isActive" } } }],
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    return res.json({
      success: true,
      message: product.isActive ? "Product activated" : "Product deactivated",
      isActive: product.isActive,
    });
  } catch (err) {
    console.error("[PATCH /products/:id/toggle]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- DELETE /products/:id ---------------------------------------
router.delete("/:id", verifyToken, requireRole("seller", "admin"), async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role === "seller") filter.seller = req.user.id;

    const product = await Product.findOneAndDelete(filter);
    if (!product) return res.status(404).json({ success: false, message: "Product not found or access denied" });

    return res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("[DELETE /products/:id]", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;