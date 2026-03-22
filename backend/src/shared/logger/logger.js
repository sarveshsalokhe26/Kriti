//Writing a basic level logger to log the details of the application
const winston = require("winston"); //importing the winston librarys 

//creating a logger names logger
const logger = winston.createLogger({
    level:"info", //level of the logs 
    format : winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp,level,message})=>{
            return `${timestamp} [${level.toUpperCase()}]:${message}` //printing the loggs with timestamp and the logg message 
        })
    ),
    transports:new winston.transports.Console(), //writing the loggs in the console for now 
});

module.exports={
    logger, //exporting the logger function
}