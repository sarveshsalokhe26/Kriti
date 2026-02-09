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

module.exports = {
    getMe,
}
