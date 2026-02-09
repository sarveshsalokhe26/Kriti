const {getEnv}=require("./environmentVariable")

//Exporting the jwt secret values using the central environment variable handling function so that we can identify
module.exports={
    jwt:{
        secret:getEnv("JWT_SECRET"), 
        expiresIn:getEnv("JWT_EXPIRES_IN",false)||"100d",
    },
};