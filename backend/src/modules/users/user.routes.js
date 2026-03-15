const express = require("express");
const router = express.Router();

const authMiddleware = require('../../shared/middleware/authMiddleware');
const userController = require("../users/user.controller")

/*
*Protcted route to get the user details  
*/
router.get("/me",authMiddleware,userController.getMe);

/*
*Protected Route to partially update the USER DETAILS
*/
router.patch("/me",authMiddleware,userController.updateMe);

/*
*Protected route for user to change the password
*/
router.patch("change-password",authMiddleware,userController.changePassword);


module.exports = router;