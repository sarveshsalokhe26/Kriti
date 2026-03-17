const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");


/*
Routes:
1.signup
2.request-verification
3.Verify-otp
4.login 
*/
router.post("/signup", controller.signup);
router.post("/request-verification", controller.requestVerification);
router.post("/verify-otp", controller.verifyOTP);
router.post("/login", controller.login);


module.exports = router;
