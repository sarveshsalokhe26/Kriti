const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const authMiddleware = require("../../shared/middleware/authMiddleware");

/**
 * Public Authentication Routes
 */

// POST /auth/signup - Register new user
router.post("/signup", controller.signup);

// POST /auth/login - Login user
router.post("/login", controller.login);

// POST /auth/request-verification - Request OTP for account verification
router.post("/request-verification", controller.requestVerification);

// POST /auth/verify-otp - Verify OTP and complete account setup
router.post("/verify-otp", controller.verifyOTP);

// POST /auth/refresh-token - Get new access token using refresh token
router.post("/refresh-token", controller.refreshToken);

// POST /auth/request-password-reset - Request password reset OTP
router.post("/request-password-reset", controller.requestPasswordReset);

// POST /auth/reset-password - Reset password with OTP
router.post("/reset-password", controller.resetPassword);

/**
 * Protected Authentication Routes
 * Require valid JWT token
 */

// GET /auth/me - Get current authenticated user
router.get("/me", authMiddleware, controller.getCurrentUser);

// POST /auth/logout - Logout current user
router.post("/logout", authMiddleware, controller.logout);

module.exports = router;