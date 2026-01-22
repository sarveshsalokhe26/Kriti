require("./config/database");
require("dotenv").config();

const express = require("express");
const {logger} = require("./shared/logger/logger")
const errorHandler = require("./shared/errors/errorHandler");
const { error } = require("winston");
require("./config");
const {generateToken,verifyToken}=require("./shared/utils/jwtTokens")

const app = express();

/**
 * Test route — proves server works
 */
app.get("/", (req, res) => {
  logger.info("Root route hit");
  res.send("Server is alive 🚀");
});

/**
 * Crash route — proves error handling
 */
app.get("/crash", (req, res, next) => {
  next(new Error("Something broke!"));
});

/**
 * Central error handler (MUST be last)
 */

//creating a response to test the health url 
app.get("/health",(req,res)=>{
  res.status(200).json({
    status:"ok",
    env:process.env.NODE_ENV,
    unptime:process.uptime(),
  })
});

//testing the jwt token creation 
const token=generateToken({userId:"123"});
console.log("JWT:",token);

const decoded=verifyToken(token);
console.log("Decoded:",decoded); //logging whether the system verifies the token created 


app.get("/crash-test",(req,res)=>{
  throw new Error("This is an intentional crash to test the server")
});

app.use(errorHandler);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
