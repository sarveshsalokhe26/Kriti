//importing the env function 
const {getEnv} = require("./environmentVariable");

module.exports={
    app :{
        port: getEnv("PORT",false)||3000,  //retrieving the port under which we are working right now,can be production,testing and development.
        env : getEnv("NODE_ENV",false)||"development", 
    },

    auth:{
        jwtSecret: getEnv("JWT_SECRET"),
        jwtExpiry: getEnv("JWT_EXPIRY",false)||"7d", //retrieving the jwt expiry 
    },
};
