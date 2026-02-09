const express = require("express");
const router = express.Router();

const authMiddleware = require('../../shared/middleware/authMiddleware');
const userController = require("./user.controller");

//Generating a protected route which is verified by the authmiddleware and then proceeds
router.get("/me",authMiddleware,userController.getMe);

module.exports = router;