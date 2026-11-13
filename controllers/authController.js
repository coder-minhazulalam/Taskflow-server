const authService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// কুকি অপশন (HttpOnly Cookie দিয়ে ব্রাউজারে সেশন নিরাপদ রাখা)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // ৭ দিন
};

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !name.trim()) {
        return sendError(res, 400, "Name is required");
      }
      if (!email || !email.trim()) {
        return sendError(res, 400, "Valid email is required");
      }
      if (!password || password.length < 6) {
        return sendError(res, 400, "Password must be at least 6 characters long");
      }

      const { user, session } = await authService.register({ name, email, password });

      // ব্রাউজারে HttpOnly কুকি সেট করা
      res.cookie("auth_session", session.token, COOKIE_OPTIONS);

      return sendSuccess(res, 201, "Account registered successfully!", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 400, "Email and password are required");
      }

      const { user, session } = await authService.login({ email, password });

      // কুকি সেট করা
      res.cookie("auth_session", session.token, COOKIE_OPTIONS);

      return sendSuccess(res, 200, "Logged in successfully!", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const token = req.cookies.auth_session;
      if (token) {
        await authService.logout(token);
      }

      // ব্রাউজার থেকে কুকি ক্লিয়ার করা
      res.clearCookie("auth_session");

      return sendSuccess(res, 200, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * লগইন করা ইউজারের বর্তমান প্রোফাইল
   */
  async getMe(req, res, next) {
    try {
      return sendSuccess(res, 200, "User profile retrieved", { user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

