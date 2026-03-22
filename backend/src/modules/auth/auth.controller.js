/**
 * Authentication Controller
 * Handles all authentication-related HTTP requests
 */

const authService = require("./auth.service");
const {
  successResponse,
  errorResponse,
} = require("../../shared/utils/responseFormatter");
const {
  createValidationError,
  createError,
} = require("../../shared/errors/errorHandler");
const {
  validateSignup,
  validateLogin,
  validateOTPRequest,
  validateOTPVerification,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
} = require("../../shared/utils/validation");
const { logger } = require("../../shared/logger/logger");
const { otp } = require("../../config/auth");

/**
 * POST /auth/signup
 * Register a new user account
 */
async function signup(req, res, next) {
  try {
    const { email, phone, password, name } = req.body;

    logger.info("Signup request received", { email, phone });

    // Validate input
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      logger.warn("Signup validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Create user
    const user = await authService.signup({
      email,
      password,
      name,
      phone,
      signupsource: "app",
    });

    res.status(201).json(
      successResponse(
        { user },
        "User registered successfully. Please verify your account.",
        201
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/request-verification
 * Request OTP for account verification
 */
async function requestVerification(req, res, next) {
  try {
    const { email, phone } = req.body;

    logger.info("Verification OTP request", { email, phone });

    // Validate input
    const validation = validateOTPRequest(req.body);
    if (!validation.isValid) {
      logger.warn("OTP request validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Request OTP
    const result = await authService.createVerificationOTP({
      email,
      phone,
    }); 
     
    // In production, don't return the OTP
    res.status(200).json(
      successResponse(
        {},
        "Verification OTP sent to your email/phone",
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/verify-otp
 * Verify OTP and complete account verification
 */
async function verifyOTP(req, res, next) {
  try {
    const { email, phone, otp } = req.body;

    logger.info("OTP verification request", { email, phone });

    // Validate input
    const validation = validateOTPVerification(req.body);
    if (!validation.isValid) {
      logger.warn("OTP verification validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Verify OTP
    await authService.verifyUserOTP({ email, phone, otp });

    res.status(200).json(
      successResponse({}, "Account verified successfully")
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
async function login(req, res, next) {
  try {
    const { email, phone, password } = req.body;

    logger.info("Login request", { email, phone });

    // Validate input
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      logger.warn("Login validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Authenticate user
    const result = await authService.loginUser({
      email,
      phone,
      password,
    });

    res.status(200).json(
      successResponse(
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
        "Login successful"
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/refresh-token
 * Get new access token using refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    logger.info("Token refresh request");

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse(
          "VAL_002",
          "Refresh token is required",
          400
        )
      );
    }

    // Refresh token
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json(
      successResponse(
        { accessToken: result.accessToken },
        "Token refreshed successfully"
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/request-password-reset
 * Request OTP for password reset
 */
async function requestPasswordReset(req, res, next) {
  try {
    const { email, phone } = req.body;

    logger.info("Password reset request", { email, phone });

    // Validate input
    const validation = validatePasswordResetRequest(req.body);
    if (!validation.isValid) {
      logger.warn("Password reset request validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Request reset
    const passwordReset = await authService.requestPasswordReset({ email, phone });

    // Don't reveal if user exists
    res.status(200).json(
      successResponse(
        {},
        "If an account exists, password reset instructions will be sent",
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/reset-password
 * Reset password with OTP verification
 */
async function resetPassword(req, res, next) {
  try {
    const { email, phone, otp, newPassword } = req.body;

    logger.info("Password reset attempt", { email, phone });

    // Validate input
    const validation = validatePasswordResetConfirm({
      otp,
      newPassword,
      resetToken: "dummy", // Validation checks for this, but we use OTP
    });
    if (!validation.isValid) {
      logger.warn("Password reset validation failed", validation.errors);
      return res.status(400).json(
        errorResponse(
          "VAL_001",
          "Validation failed",
          400,
          validation.errors
        )
      );
    }

    // Reset password
    await authService.resetPasswordWithOTP({
      email,
      phone,
      otp,
      newPassword,
    });

    res.status(200).json(
      successResponse({}, "Password reset successfully")
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/me
 * Get current authenticated user info
 */
async function getCurrentUser(req, res, next) {
  try {
    // User is already authenticated by middleware
    const userId = req.user.id;

    // TODO: Fetch full user details from database
    res.status(200).json(
      successResponse(
        { userId },
        "User authenticated successfully"
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/logout
 * Logout user (invalidate token)
 */
async function logout(req, res, next) {
  try {
    // In a production system, you might want to:
    // 1. Add token to blacklist in Redis
    // 2. Update user's last_logout_at timestamp
    // For now, we'll just send success response

    res.status(200).json(
      successResponse({}, "Logged out successfully")
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signup,
  requestVerification,
  verifyOTP,
  login,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  logout,
};