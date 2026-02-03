//writing the controller 
//what does the controller do ? controller reads the http request calls the service and returns the response to the user
const authService= require("./auth.service");

/*
 *Signup Request
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

        res.status(200).json({
            message:"The user signup was successfull",
        })
        
    }
    catch(error){
        next(error);
    }
}

/*
 *Request otp for verification
*/
async function  requestVerification(req,res,next) {
    try{

        //Request body consist of email and phone number which user's gonna try to verfy
        const{email,phone}=req.body; 
        
        //returning error if user sends an empty request
        if(!email && !phone){
            return res.status(400).json({
                message:"Email or phone is required",
            });
        }
        
        //calling the verification service
        await authService.createVerificationOTP({email,phone});
        
        res.status(200).json({
            message:"Verification otp is sent",
        });

    }catch(err){
        next(err);
    }
}

/*
 *verifying otp sent by the user
*/
async function verifyOTP(req,res,next) {
    try{//Required body for verifying the otp 
    const {email,phone,otp}=req.body;

    //Returning the error if the request is empty
    if((!email&&!phone)&&!otp){
        res.status(400).json({
            message:"Identifier and OTP is required",
        });
    }

    //calling the verification service to verify the user 
    await authService.verifyUserOTP({email,phone,otp});

    //Verification successfull response 
    res.status(200).json({
        message:"Account verified Successfully",
    });
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
            return res.status(400).json({
                message:"Identifiers and password are required",
            });
        }

        const token = await authService.loginUser({email,phone,password});

        res.status(200).json({
            message:"Login Successfull",
            token,
        });

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
