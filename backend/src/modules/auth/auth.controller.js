 /**
what does the controller do ? 
controller reads the http request, calls the service and returns the response to the user
*/
const authService= require("./auth.service");
const {successResponse,errorResponse}= require("../../shared/utils/response");
const AppError = require("../../shared/errors/appError");

/*
 *Signup Request.
*/ 
async function signup(req,res,next) {
    try{
        const{email,password,name,phone}=req.body;

        const user = await authService.signup({
            email,
            password,
            name,
            phone,
            signupsource:"app",
        });
        
        /*
        *Successfull signup response: Notifying the user that the signup was successfull.  
        */
        return successResponse(res,null,"The signup was successful");
        
    }
    catch(error){
        next(error);
    }
}

/*
 * Request otp for verification.
*/
async function  requestVerification(req,res,next) {
    try{

        const{email,phone}=req.body; 
        
        /*
        * Error Handle: if the request does no contain any indentifiers returning an error.
        */
        if(!email && !phone){
            throw new AppError("Email or phone is required",401,"MISSING_IDENTIFIER");
        }
        
        /*
        * Calling the verification service. 
        */
        await authService.createVerificationOTP({email,phone});
        
        /*
        * Success Response: Verification otp has been sent. 
        */
        return successResponse(res,null,"Verification otp has been sent")
    }catch(err){
        next(err);
    }
}

/*
 *verifying otp sent by the user.
*/
async function verifyOTP(req,res,next) {
    try{

    /*
    Verify OTP body:
    1.Email or Phone.
    2.OTP received.
    */    
    const {email,phone,otp}=req.body;

    /*
    *Error Handle: Empty verification request, No data provided for verification.
    */
    if((!email&&!phone)&&!otp){
        throw new AppError("Identifier and OTP is required",400,"MISSING_OTP_FIELDS")
    }

    /*
    *Calling the verification service
    */
    await authService.verifyUserOTP({email,phone,otp});

    /*
    * Success response: Returning an response that the Account verified successfully.
    */ 
    return successResponse(res,null,"Account verified successfully")
  }
   catch(err){
    next(err);
  }
}

/*
 *Login request 
*/ 
async function login(req,res,next) {
    try{
        const {email,phone,password}=req.body;
        
        //Throwing error if the request has empty body 
        if((!email&&!phone)||!password){
            throw new AppError("Identifier and password is missing",400,"IDENTIFIER_AND_PASSWORD_MISSING");
        }

        const token = await authService.loginUser({email,phone,password});

        return successResponse(res,token,"Login successfull",200);

    }catch(err){
        next(err);
    }
}

module.exports={
    signup,
    requestVerification,
    verifyOTP,
    login
};
