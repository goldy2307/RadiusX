require("dotenv").config();

const express     = require("express");
const helmet      = require("helmet");
const cors        = require("cors");
const morgan      = require("morgan");
const rateLimit   = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path        = require("path");
const fs          = require("fs");

const connectDB   = require("./config/db");
const { getRedis } = require("./config/redis");

const authRouter    = require("./routes/auth");
const sellerRouter  = require("./routes/seller");
const productRouter = require("./routes/product");
const adminRouter   = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 5000;

// -- Ensure upload directory exists ----------------------------
const uploadDir = path.join(__dirname, "uploads/products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -- Security & parsing ----------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image serving
}));

app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:5500",  // Live Server
    "http://127.0.0.1:5500",
  ],
  credentials: true, // needed for httpOnly cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// -- Logging ---------------------------------------------------
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// -- Rate limiting ---------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // tighter for auth endpoints
  message: { success: false, message: "Too many auth attempts, please wait 15 minutes" },
});

app.use(globalLimiter);

// -- Static file serving (uploaded product images) -------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -- Health check ----------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// -- Routes ----------------------------------------------------
app.use("/auth",     authLimiter, authRouter);
app.use("/seller",   sellerRouter);
app.use("/products", productRouter);
app.use("/admin",    adminRouter);

// -- 404 handler -----------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// -- Global error handler --------------------------------------
app.use((err, req, res, next) => {
  console.error("[Unhandled error]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large. Max 5MB allowed." });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

// -- Bootstrap: connect DB then start server -------------------
async function bootstrap() {
  await connectDB();

  // Connect Redis (non-blocking -- app works without it)
  const redis = getRedis();
  if (redis) {
    redis.connect().catch((e) => console.warn("[Redis] Could not connect:", e.message));
  }

  // Seed admin user on first boot
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`[Server] RadiusX API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

// -- Seed initial admin account (runs only if no admin exists) -
async function seedAdmin() {
  try {
    const User = require("./models/User");
    const exists = await User.findOne({ role: "admin" });
    if (exists) return;

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn("[Seed] ADMIN_EMAIL / ADMIN_PASSWORD not set -- skipping admin seed");
      return;
    }

    await User.create({
      name:     process.env.ADMIN_NAME     || "RadiusX Admin",
      email:    process.env.ADMIN_EMAIL,
      mobile:   "9000000000",
      password: process.env.ADMIN_PASSWORD,
      pincode:  "000000",
      address:  "Admin",
      role:     "admin",
    });
    console.log("[Seed] Admin account created:", process.env.ADMIN_EMAIL);
    console.log("[Seed] Change ADMIN_PASSWORD immediately after first login!");
  } catch (err) {
    console.error("[Seed] Admin seed failed:", err.message);
  }
}

bootstrap();