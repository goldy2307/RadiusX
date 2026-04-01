require("dotenv").config();

const express      = require("express");
const helmet       = require("helmet");
const cors         = require("cors");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const passport     = require("passport");
const path         = require("path");
const fs           = require("fs");

const connectDB    = require("./config/db");
const { getRedis } = require("./config/redis");
require("./config/passport"); // register Google strategy

const authRouter    = require("./routes/auth");
const sellerRouter  = require("./routes/seller");
const productRouter = require("./routes/product");
const adminRouter   = require("./routes/admin");
const ordersRouter  = require("./routes/orders");

const app  = express();
const PORT = process.env.PORT || 5000;

// -- Upload directory ------------------------------------------
const uploadDir = path.join(__dirname, "uploads/products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -- Security --------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// -- CORS (function-based to handle all localhost ports) -------
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
    ].filter(Boolean);
    if (!origin) return callback(null, true); // curl / Postman / server-to-server
    if (allowed.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error("CORS: origin " + origin + " not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(passport.initialize()); // no sessions — we use JWT

// -- Logging ---------------------------------------------------
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// -- Rate limiting ---------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

/* Auth limiter — only applies to login/register, NOT refresh
   Refresh is called silently on every page load so it must be separate */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.path === "/refresh", // never rate-limit token refresh
  message: { success: false, message: "Too many login attempts, please wait 15 minutes" },
});

app.use(globalLimiter);

// -- Static files ----------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -- Health check ----------------------------------------------
app.get("/health", (req, res) => {
  res.json({ success: true, status: "OK", timestamp: new Date().toISOString(), env: process.env.NODE_ENV || "development" });
});

// -- Routes ----------------------------------------------------
app.use("/auth",     authLimiter, authRouter);
app.use("/seller",   sellerRouter);
app.use("/products", productRouter);
app.use("/admin",    adminRouter);
app.use("/orders",   ordersRouter);

// -- 404 -------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// -- Error handler ---------------------------------------------
app.use((err, req, res, next) => {
  console.error("[Unhandled error]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large. Max 5MB." });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

// -- Bootstrap -------------------------------------------------
async function bootstrap() {
  await connectDB();

  const redis = getRedis();
  if (redis) redis.connect().catch((e) => console.warn("[Redis] Could not connect:", e.message));

  await seedAdmin();

  // Verify SMTP on startup
  const { testSMTP } = require("./services/notifyService");
  testSMTP().catch(() => {});

  app.listen(PORT, () => {
    console.log(`[Server] RadiusX API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

async function seedAdmin() {
  try {
    const User = require("./models/User");
    const exists = await User.findOne({ role: "admin" });
    if (exists) return;
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn("[Seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed");
      return;
    }
    await User.create({
      name:     process.env.ADMIN_NAME || "RadiusX Admin",
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