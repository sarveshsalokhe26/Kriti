//importing the jwt lib
const jwt = require("jsonwebtoken");

//importing the auth.js file as we retrieve the jwt secret from an centralized env function
const authconfig = require("../../config/auth");

//function to create jwt tokens
function generateToken(payload){
    return jwt.sign(payload,authconfig.jwt.secret,{expiresIn:authconfig.jwt.expiresIn});
}
//the function requires the payload that is the data that is supposed to be transferred , jwt secret value and the token expiration value which is 7 days for our application

//function for verifying the jwt tokens 
function verifyToken(token){
    return jwt.verify(token,authconfig.jwt.secret);
}

module.exports={
    generateToken,
    verifyToken
}


