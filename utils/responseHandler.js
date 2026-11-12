/**
 * স্ট্যান্ডার্ড সফল রেসপন্স ফরম্যাটার
 */
const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * স্ট্যান্ডার্ড এরর রেসপন্স ফরম্যাটার
 */
const sendError = (res, statusCode = 500, message = "An error occurred", error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? (error.message || error) : null,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};

