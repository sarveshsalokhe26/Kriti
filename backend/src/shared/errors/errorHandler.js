const {logger} = require("../logger/logger");

function errorHandler(err, req, res, next) {
  /*
  *Logging an error 
  */
  logger.error(err.message);

  const statusCode = err.statusCode || 500;
  const code = err.code || "Internal server error";
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    status:"Error",
    code,
    message
  });
}
module.exports = {
  errorHandler,
}