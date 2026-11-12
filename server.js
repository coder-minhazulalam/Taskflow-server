const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ১. কোর মিডলওয়্যার কনফিগারেশন
app.use(morgan("dev")); // প্রতিটি HTTP রিকোয়েস্ট কনসোলে লগ করে
app.use(express.json()); // JSON Body পার্স করে
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // কুকি পার্স করে

// ২. CORS কনফিগারেশন (Next.js ফ্রন্টএন্ড যাতে কুকি ও রিকোয়েস্ট পাঠাতে পারে)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // কুকি ও অথেনটিকেশন হেডার আদান-প্রদানের অনুমতি
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ৩. হেলথ চেক রুট (সার্ভার ঠিক আছে কি না চেক করার জন্য)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "TaskFlow Express Server is running smoothly! 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ৪. ৪০৪ এবং গ্লোবাল এরর হ্যান্ডলার
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ৫. সার্ভার চালু করা
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 TaskFlow Express Server is running on port: ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed Client URL: ${CLIENT_URL}`);
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

