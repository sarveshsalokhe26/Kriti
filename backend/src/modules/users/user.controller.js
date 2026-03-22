const userService = require("./user.service");
const {successResponse}= require("../../shared/utils/response");
const AppError = require("../../shared/errors/appError");

async function getMe(req,res,next) {
    try{ 

        /*
        *Retrieving user credentials from database using userID
        */
        const user = await userService.getUserByID(req.user.id);
        
        /*
         *Returning the user credentials 
        */
        return successResponse(res,user,null,200);

    }catch(err){
        next(err);
    }
}

/*
*Updating user partially
*/
async function updateMe(req,res,next) {
    try{
        /*
        *Calling the user service to update the user
        */
        const updateUser = await userService.updateUserByID(req.user.id,req.body);

        /*
        *Returning the updated user Credentials
        */
        return successResponse(res,updateUser,"User updation was successfull",200);
        
    }catch(err){
        next(err);
        console.log(err);
    }
}

/*
*Changing user password
*/
async function changePassword(req,res,next) {
    try{

        /*
        *Change password request body
        */
        const {currentPassword,newPassword}=req.body;
        
        
        /*
        * Throwing an error if the current and new password are not provided
        */
        if(!currentPassword || !newPassword){
            throw new AppError("Current password and new password are required",400,"MISSING_PASSWORD_FIELDS");
        }
        
        /*
        *Calling the change password service  
        */
        await userService.changePassword(
            req.user.userID,
            currentPassword,
            newPassword
        )
        
        /*
        *Returning an success response that the password updation was successfull 
        */
        return successResponse(res,null,"Password changed successfully,please login again");

    }catch(err){
        next(err)
    }
}

module.exports = {
    getMe,
    updateMe,
    changePassword
}
