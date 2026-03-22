require("dotenv").config();
const express = require("express");

require("./config/database");
require("./config");

const { logger } = require("./shared/logger/logger");
const { errorHandler } = require("./shared/errors/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");
const authMiddleware = require("./shared/middleware/authMiddleware");
const userRoutes = require("./modules/users/user.routes");

const app = express();

/**
 * ==================== MIDDLEWARE SETUP ====================
 */

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});

/**
 * ==================== ROUTES ====================
 */

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  logger.info("Root route accessed");
  res.status(200).json({
    success: true,
    message: "Kriti App API Server",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Auth routes (public and protected)
app.use("/auth", authRoutes);

// User routes
app.use("/users", userRoutes);

/**
 * ==================== DEBUG/TEST ROUTES ====================
 */

// Test authorized endpoint
app.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated",
    userId: req.user.id,
  });
});

// Test error handling
app.get("/crash", (req, res, next) => {
  next(new Error("Test error - something broke!"));
});

app.get("/crash-test", () => {
  throw new Error("Intentional test crash");
});

/**
 * ==================== 404 HANDLER ====================
 */

app.use((req, res) => {
  logger.warn("404 - Route not found", {
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    statusCode: 404,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * ==================== ERROR HANDLING ====================
 */

// Error handler MUST be last
app.use(errorHandler);

/**
 * ==================== SERVER STARTUP ====================
 */

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  logger.info(`🚀 Server started successfully`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  logger.info("Available routes:");
  logger.info("  [GET]  /health - Health check");
  logger.info("  [GET]  / - Server info");
  logger.info("  [POST] /auth/signup - Register user");
  logger.info("  [POST] /auth/login - Login user");
  logger.info("  [POST] /auth/refresh-token - Refresh access token");
  logger.info("  [GET]  /auth/me - Get current user (protected)");
  logger.info("  [POST] /auth/logout - Logout (protected)");
});

module.exports = app;

