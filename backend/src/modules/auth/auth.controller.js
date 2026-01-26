//writing the controller 
//what does the controller do ? controller reads the http request calls the servicer and returns the response to the user
const authService= require("./auth.service");//importing  the service module 

//writing a function to handle the request
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
        
    }
    catch(error){
        next(error);
    }
}

module.exports={
    signup,
};
