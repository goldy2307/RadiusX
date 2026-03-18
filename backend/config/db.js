const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("[DB] MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[DB] MongoDB disconnected — attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[DB] MongoDB reconnected");
});

module.exports = connectDB;