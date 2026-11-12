const { sendError } = require("../utils/responseHandler");

// 404 Route Not Found হ্যান্ডলার
const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

// গ্লোবাল এরর হ্যান্ডলার মিডলওয়্যার
const globalErrorHandler = (err, req, res, next) => {
  console.error("🔥 Global Error Caught:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return sendError(res, statusCode, message, err);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};

