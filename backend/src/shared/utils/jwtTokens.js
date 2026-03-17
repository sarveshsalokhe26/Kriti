//importing the jwt lib
const jwt = require("jsonwebtoken");

//importing the auth.js file as we retrieve the jwt secret from an centralized env function
const authconfig = require("../../config/auth");

/*
*Function to generate a jwt Access token  
*/
function generateToken(payload){
    return jwt.sign(payload,authconfig.jwt.secret,{expiresIn:"15m"});
}

/*
*Function to generate a jwt refresh token 
*/
function generateRefreshToken(payload){
    return jwt.sign(payload,authconfig.jwt.secret,{expiresIn:"7d"});
}

//function for verifying the jwt tokens 
function verifyToken(token){
    return jwt.verify(token,authconfig.jwt.secret);
}

module.exports={
    generateToken,
    verifyToken,
    generateRefreshToken
}


