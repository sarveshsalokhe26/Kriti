const { logger } = require("../logger/logger");
const { errorResponse } = require("../utils/responseFormatter");

/**
 * Error Code Mappings
 * Format: AUTH_XXX for auth errors, VAL_XXX for validation, etc.
 */
const ERROR_CODES = {
  // Validation errors (400)
  VAL_001: {
    message: "Invalid input provided",
    statusCode: 400,
  },
  VAL_002: {
    message: "Missing required fields",
    statusCode: 400,
  },

  // Authentication errors (401)
  AUTH_001: {
    message: "Invalid email or phone",
    statusCode: 401,
  },
  AUTH_002: {
    message: "Invalid password",
    statusCode: 401,
  },
  AUTH_003: {
    message: "Authorization header missing",
    statusCode: 401,
  },
  AUTH_004: {
    message: "Invalid or expired token",
    statusCode: 401,
  },
  AUTH_005: {
    message: "Token required",
    statusCode: 401,
  },
  AUTH_006: {
    message: "Account not verified",
    statusCode: 401,
  },
  AUTH_007: {
    message: "Invalid OTP",
    statusCode: 401,
  },
  AUTH_008: {
    message: "OTP expired",
    statusCode: 401,
  },

  // Resource conflict (409)
  CONFLICT_001: {
    message: "User already exists with this email",
    statusCode: 409,
  },
  CONFLICT_002: {
    message: "User already exists with this phone",
    statusCode: 409,
  },

  // Not found (404)
  NOT_FOUND_001: {
    message: "User not found",
    statusCode: 404,
  },
  NOT_FOUND_002: {
    message: "OTP not found",
    statusCode: 404,
  },

  // Rate limiting (429)
  RATE_LIMIT_001: {
    message: "Too many attempts. Please try again later",
    statusCode: 429,
  },

  // Server errors (500)
  SERVER_001: {
    message: "Internal server error",
    statusCode: 500,
  },
};

/**
 * Main error handler middleware
 * Catches all errors and returns standardized response
*/
function errorHandler(err, req, res, next) {
  let errorCode = "SERVER_001";
  let statusCode = 500;
  let message = "Internal server error";
  let details = null;

  /*
  *Log the error 
  */
  logger.error({
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom application errors
  if (err.code && ERROR_CODES[err.code]) {
    const errorDef = ERROR_CODES[err.code];
    errorCode = err.code;
    statusCode = errorDef.statusCode;
    message = err.message || errorDef.message;
    details = err.details;
  }
  // Handle validation errors
  else if (err.isValidation) {
    errorCode = "VAL_001";
    statusCode = 400;
    message = "Validation failed";
    details = err.details;
  }
  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    errorCode = "AUTH_004";
    statusCode = 401;
    message = "Invalid or expired token";
  }
  // Handle JWT expiration
  else if (err.name === "TokenExpiredError") {
    errorCode = "AUTH_004";
    statusCode = 401;
    message = "Token has expired";
  }
  // Handle database errors
  else if (err.name === "DatabaseError" || err.code === "ECONNREFUSED") {
    logger.error("Database connection error:", err);
    errorCode = "SERVER_001";
    statusCode = 500;
    message = "Database error occurred";
  }
  // Handle custom application errors
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Send error response
  return res.status(statusCode).json(
    errorResponse(errorCode, message, statusCode, details)
  );
}

/**
 * Create custom application error
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 * @returns {Error}
 */
function createError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  if (ERROR_CODES[code]) {
    error.statusCode = ERROR_CODES[code].statusCode;
  }
  error.details = details;
  return error;
}

/**
 * Create validation error
 * @param {object} details - Validation error details
 * @returns {Error}
 */
function createValidationError(details) {
  const error = new Error("Validation failed");
  error.isValidation = true;
  error.statusCode = 400;
  error.details = details;
  return error;
}

module.exports = {
  errorHandler,
  createError,
  createValidationError,
  ERROR_CODES,
};