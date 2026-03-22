const { verifyAccessToken, verifyToken } = require("../utils/jwtTokens");
const { createError } = require("../errors/errorHandler");
const { logger } = require("../logger/logger");

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user info to request
 * Expected header format: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader) {
      logger.warn("Missing authorization header", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      throw createError(
        "AUTH_003",
        "Authorization header is missing"
      );
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      logger.warn("Invalid authorization format", {
        path: req.path,
        method: req.method,
      });
      throw createError(
        "AUTH_003",
        "Invalid Authorization format. Expected: Bearer <token>"
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token is not empty
    if (!token) {
      throw createError("AUTH_005", "Token is missing");
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (tokenError) {
      logger.warn("Token verification failed", {
        error: tokenError.message,
        path: req.path,
      });
      throw createError("AUTH_004", tokenError.message);
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp,
      issuer: decoded.iss,
    };

    // Continue to next middleware
    next();
  } catch (err) {
    // Handle errors through error middleware
    next(err);
  }
}

/**
 * Optional authentication middleware
 * Doesn't require authentication but adds user info if token is present
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.userId,
          iat: decoded.iat,
          exp: decoded.exp,
          issuer: decoded.iss,
        };
      } catch (tokenError) {
        // Token is invalid but not required, so we just log it
        logger.debug("Optional token verification failed", {
          error: tokenError.message,
        });
      }
    }

    // Always continue to next middleware
    next();
  } catch (err) {
    // Continue even if there's an error
    next();
  }
}

/**
 * Middleware to check if user has required role
 * @param {string|string[]} requiredRoles - Role(s) required for access
 * @returns {function} Express middleware
 */
function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw createError("AUTH_003", "User not authenticated");
      }

      if (!req.user.role || !roles.includes(req.user.role)) {
        logger.warn("Insufficient permissions", {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path,
        });
        throw createError(
          "AUTH_006",
          "Insufficient permissions for this action"
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
module.exports.requireRole = requireRole;