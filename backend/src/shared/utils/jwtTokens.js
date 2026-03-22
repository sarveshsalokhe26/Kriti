//importing the jwt lib
const jwt = require("jsonwebtoken");

//importing the auth.js file as we retrieve the jwt secret from an centralized env function
const authconfig = require("../../config/auth");

/**
 * Generate access token (short-lived)
 * @param {object} payload - Token payload
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, authconfig.jwt.secret, {
    expiresIn: authconfig.jwt.accessTokenExpiry || "1h",
    issuer: "kriti-app",
    subject: payload.userId,
  });
}

/**
 * Generate refresh token (long-lived)
 * @param {object} payload - Token payload
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, authconfig.jwt.refreshSecret, {
    expiresIn: authconfig.jwt.refreshTokenExpiry || "7d",
    issuer: "kriti-app",
    subject: payload.userId,
  });
}

/**
 * Generate both access and refresh tokens
 * @param {object} payload - Token payload
 * @returns {object} { accessToken, refreshToken }
 */
function generateTokenPair(payload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Generate legacy token (backward compatibility)
 * Used for simple single-token responses
 * @param {object} payload - Token payload
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, authconfig.jwt.secret, {
    expiresIn: authconfig.jwt.expiresIn || "100d",
  });
}

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, authconfig.jwt.secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Access token has expired");
    }
    throw new Error("Invalid access token");
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, authconfig.jwt.refreshSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token has expired");
    }
    throw new Error("Invalid refresh token");
  }
}

/**
 * Verify token (generic, for backward compatibility)
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, authconfig.jwt.secret);
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean}
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Get time until token expiry in seconds
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiry, or -1 if expired
 */
function getTokenExpiryTime(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return -1;
    const secondsUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
    return secondsUntilExpiry > 0 ? secondsUntilExpiry : -1;
  } catch (error) {
    return -1;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  generateToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiryTime,
};


