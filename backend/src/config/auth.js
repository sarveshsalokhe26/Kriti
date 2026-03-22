const { getEnv } = require("./environmentVariable");

module.exports = {
  jwt: {
    // Access token configuration
    secret: getEnv("JWT_SECRET"),
    expiresIn: getEnv("JWT_EXPIRES_IN", false) || "100d", // Legacy token expiry
    accessTokenExpiry:
      getEnv("JWT_ACCESS_TOKEN_EXPIRY", false) || "1h",

    // Refresh token configuration
    refreshSecret: getEnv("JWT_REFRESH_SECRET"),
    refreshTokenExpiry:
      getEnv("JWT_REFRESH_TOKEN_EXPIRY", false) || "7d",

    // Token settings
    issuer: getEnv("JWT_ISSUER", false) || "kriti-app",
    audience: getEnv("JWT_AUDIENCE", false) || "kriti-users",
  },

  // OTP settings
  otp: {
    expiryMinutes: Number(getEnv("OTP_EXPIRY_MINUTES", false) || 10),
    maxAttempts: Number(getEnv("OTP_MAX_ATTEMPTS", false) || 5),
  },

  // Password reset settings
  passwordReset: {
    tokenExpiryMinutes: Number(
      getEnv("PASSWORD_RESET_EXPIRY_MINUTES", false) || 30
    ),
  },

  // Session settings
  session: {
    maxConcurrentSessions: Number(
      getEnv("MAX_CONCURRENT_SESSIONS", false) || 5
    ),
  },
};