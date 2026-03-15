const {verifyToken} = require("../utils/jwtTokens");
const db = require("../../config/database");

async function authMiddleware(req,res,next){
    try{
        
        //reading the authorization header from the request of the user : format Bearer and the token
        const authHeader = req.headers.authorization;

        //if the header is not available we return the error to the user that the authorization header is not provided
        if(!authHeader){
            return res.status(401).json({
                error:"Authorization header is missing",
            });
        }

        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({
                error:"Invalid Authorization format", 
            })
        }

        //expected format is broken down and the token is seperated from the bearer so that we can verify it  
        const token = authHeader.substring(7);
        
        //Returning error to the user if the token is not available 
        if(!token){
            return res.status(401).json({
                error:"Token missing",
            });
        }
        
        //Verifying the token 
        const decoded = verifyToken(token);

        /*
        *Verifying whether the user changed the password or not and whether the token is valid or not 
        */
        const user = await db.query(`SELECT password_changed_at FROM users WHERE id=$1`,[decoded.userId]);

        //looop to execute only of the password has been changed
        if(user.rows[0].password_changed_at){
            const passwordChangedAt = Math.floor(new Date(user.rows[0].password_changed_at).getTime()/1000);

            if(decoded.iat<passwordChangedAt){
            return res.status(401).json({
                error:"Token invalid due to password change"
            })
            }
        }

        //Attach trusted user info to request
        req.user={
            id:decoded.userId,
        }

        next();
        
    }catch(err){
        console.log("Error:",err.message);
        return res.status(401).json({
            error:"Invalid or expired token",
        })
    }
}

module.exports = authMiddleware;