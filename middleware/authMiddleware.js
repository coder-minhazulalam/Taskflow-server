const authService = require("../services/authService");
const { sendError } = require("../utils/responseHandler");

/**
 * প্রটেক্টেড রাউটের জন্য অথেনটিকেশন গার্ড মিডলওয়্যার
 */
const requireAuth = async (req, res, next) => {
  try {
    // ১. কুকি অথবা Authorization হেডার থেকে টোকেন নেওয়া
    let token = req.cookies.auth_session;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return sendError(res, 401, "Authentication required. Please log in.");
    }

    // ২. ডেটাবেসে সেশন যাচাই করা
    const user = await authService.getSessionUser(token);

    if (!user) {
      return sendError(res, 401, "Invalid or expired session. Please log in again.");
    }

    // ৩. রিকোয়েস্টে ইউজার অবজেক্ট যুক্ত করে পরবর্তী মিডলওয়্যার বা কন্ট্রোলারে পাঠানো
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return sendError(res, 500, "Authentication check failed", error);
  }
};

/**
 * অপশনাল অথ মিডলওয়্যার (লগইন করা থাকলে req.user পাবে, না থাকলে এরর দেবে না)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.auth_session;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (token) {
      const user = await authService.getSessionUser(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
};

