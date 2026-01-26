const express = require("express");
const router = express.Router();

const { signup } = require("./auth.controller");

// POST /auth/signup
router.post("/signup", signup);

module.exports = router;
