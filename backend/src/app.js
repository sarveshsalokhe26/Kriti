require("dotenv").config();
const express = require("express");

require("./config/database");
require("./config");

const { logger } = require("./shared/logger/logger");
const {errorHandler} = require("./shared/errors/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");
const authMiddleware = require("./shared/middleware/authMiddleware");
const userRoutes = require("./modules/users/user.routes");

const app = express();

// 🔴 REQUIRED: parse JSON bodies
app.use(express.json());

// routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// test routes
app.get("/", (req, res) => {
  logger.info("Root route hit");
  res.send("Server is alive 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// error tests
app.get("/crash", (req, res, next) => {
  next(new Error("Something broke!"));
});

app.get("/crash-test", () => {
  throw new Error("Intentional crash test");
});

app.get("/me",authMiddleware,(req,res)=>{
  res.json({
    message:"You're Authorised",
    userID:req.user.id,
  });
});

// error handler MUST be last
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

