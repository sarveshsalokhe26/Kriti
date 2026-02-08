const {verifyToken} = require("../utils/jwtTokens");

function authMiddleware(req,res,next){
    try{
        
        //reading the authorization header from the request of the user : format Bearer and the token
        const authHeader = req.headers.authorization;
        
        //if the header is not available we return the error to the user that the authorization header is not provided
        if(!authHeader){
            return res.status(401).json({
                error:"Authorization header is missing",
            });
        }

        //expected format is broken down and the token is seperated from the bearer so that we can verify it  
        const token = authHeader.split("")[1];
        
        //Returning error to the user if the token is not available 
        if(!token){
            return res.status(401).json({
                error:"Token missing",
            });
        }
        
        //Verifying the token 
        const decoded = verifyToken(token);
        
        //Attach trusted user info to request
        req.user={
            id:decoded.userId,
        }

        next();
        
    }catch(err){
        return res.status(401).json({
            error:"Invalid or expired token",
        })
    }
}

module.exports=authMiddleware;