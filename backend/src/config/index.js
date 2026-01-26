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

    db  : {
        host: getEnv("DB_HOST"),
        port: Number(getEnv("DB_PORT", false)) || 5432,
        user: getEnv("DB_USER"),
        password: getEnv("DB_PASSWORD"),
        name: getEnv("DB_NAME"),
        ssl: getEnv("DB_SSL", false) === "true",
    },
};
