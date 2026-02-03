const express = require("express");
const router = express.Router();
const { signup } = require("./auth.controller");
const controller = require("./auth.controller");


// POST /auth/signup
router.post("/signup", signup);
router.post("/request-verification", controller.requestVerification);
router.post("/verify-otp", controller.verifyOTP);
router.post("/login", controller.login);


module.exports = router;
