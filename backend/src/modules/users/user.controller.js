const userService = require("./user.service");

async function getMe(req,res,next) {
    try{    
        //Retreiving the user data by user id 
        const user = await userService.getUserByID(req.user.id);
        
        //Response
        res.status(200).json({
            user,
        });

    }catch(err){
        next(err);
    }
}

/*
*Updating user partially
*/
async function updateMe(req,res,next) {
    try{
        //updating the user 
        const updateUser = await userService.updateUserByID(req.user.id,req.body);

        //sending the response to the user that the profile update was successfull
        res.status(200).json({
            user:updateUser,
        })
    }catch(err){
        next(err);
        console.log(err);
    }
}

module.exports = {
    getMe,
    updateMe
}
