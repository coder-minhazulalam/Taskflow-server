const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");
const { optionalAuth } = require("./middleware/authMiddleware");

// Routes Import
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ১. কোর মিডলওয়্যার কনফিগারেশন
app.use(morgan("dev")); // রিকোয়েস্ট লগিং
app.use(express.json()); // JSON Body পার্সিং
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Cookie পার্সিং

// ২. CORS কনফিগারেশন (Next.js ফ্রন্টএন্ড এর সাথে কুকি আদান-প্রদান)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ৩. হেলথ চেক রুট
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "TaskFlow Express Server is running smoothly! 🚀",
    database: "Supabase PostgreSQL Connected",
    timestamp: new Date().toISOString(),
  });
});

// ৪. মূল API রাউটস মাউন্ট করা
app.use("/api/auth", authRoutes);
app.use("/api/tasks", optionalAuth, taskRoutes);

// ৫. ৪০৪ এবং গ্লোবাল এরর হ্যান্ডলার
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ৬. সার্ভার চালু করা
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 TaskFlow Express Server is running on port: ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📋 Tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`=================================================`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n⚠️ Port ${PORT} ইতিমধ্যে অন্য কোনো অ্যাপ্লিকেশনে চালু আছে!`);
    console.error(`👉 অনুগ্রহ করে আপনার .env ফাইলে PORT=5001 বা অন্য কোনো পোর্ট দিয়ে আবার চালু করুন।\n`);
  } else {
    console.error("Server Error:", error);
  }
});

module.exports = app;
