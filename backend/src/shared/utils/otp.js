//generating an otp infrastructure
const bcypt = require("bcrypt");
const crypto = require("crypto");

/*
 *Generating a secure 6 digit otp
*/
function generateOTP(){
    return crypto.randomInt(100000,1000000).toString(); //generating a random 6dgit otp usning crypto inbuit library which is more secure that the random math function
}

/*
 *Hashing the generated function with the help of bcypt library 
*/ 
function hashOTP(otp){
    const saltRounds=10;
    return bcypt.hash(otp,saltRounds);
}

/*
 *writing a function to compare the hashed otp
*/
function compareOTP(otp,hash){
    return bcypt.compare(otp,hash);
}

/*
 *writing a function to verify whether the givem otp is expired or not 
*/
function isOTPExpired(ExpiresAt){
    return new Date()> new Date(ExpiresAt);//we compare it with the timestamp at which the otp was generated to verify weather the otp is generated or not
}

//Function to calculate the the OTP expiry time so that we can compare them easily whether the otp is expired or is valid
function getOTPExpiry(){
    const minutes = Number(process.env.OTP_EXPIRY_MINUTES||10);//Retrieving the otp expiry time from the env variable 
    return new Date(Date.now()+minutes*60*1000)//calculating the time at which the otp expires in milli seconds
}

module.exports={
    generateOTP,
    hashOTP,
    compareOTP,
    isOTPExpired,
    getOTPExpiry
};
