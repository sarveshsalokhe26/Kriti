const { compare } = require("bcrypt");
const db = require("../../config/database");
const AppError = require("../../shared/errors/appError");
const {comparePassword, hashPassword}=require("../../shared/utils/passwordHashing");


/*
*Retrieving the User Details using the userID provided by the user itself
*/
async function getUserByID(userID) {
    
    /*
    *Datatbase query to retrieve the USER DETAILS;
    */
    const result =await db.query(
        `SELECT 
        id,
        email,
        phone,
        is_verified,
        created_at

        FROM users
        WHERE id =$1`,
        [userID]
    );
    
    /*
    *Throwing an error if the user was not found
    */
    if((await result).rows.length===0){
        throw new AppError("User not found");
    }
    
    /*
    *Returning the user details  
    */
    return (await result).rows[0];
}

/*
 * Updating the user partially
 */
async function updateUserByID(userID,data) {
    
    /*
    *Allowed fields that can be updated
    */
    const allowedFields = ["name"];
    const updates = [];
    const values = [];  
    let paramIndex = 1;
    
    
    for(const field of allowedFields){
        if(data[field]!==undefined){
            updates.push(`${field}=$${paramIndex}`)
            values.push(data[field])  
            paramIndex++;
        }
    }

    /*
    *No values provided Error 
    */ 
    if(values.length===0){
        throw new AppError("No valid fields provided fo the updates");
    }
    
    values.push(userID);
    
    /*
    *Database query to update the allowed fields 
    */
    const result = await db.query(
        `UPDATE users
         SET ${updates.join(", ")},updated_at=NOW()
         WHERE id = $${paramIndex}
         RETURNING id,email,phone,name,is_verified,created_at
        `,values
    )
    
    /*
    *Returning the updated data 
    */
    return result.rows[0];
} 

/*
*Service: Updating the user password
*/
async function changePassword(userID,currentPassword,newPassword) {
    
    /*
    * Retrieving the existing password from the Database
    */
    const result = await db.query(
        `SELECT password_hash FROM users where id=$1`,[userID]
    );

    /*
    *Returning a error if the uder not found 
    */
    if(result.rows.length===0){
        throw new AppError("User not found",400,"USER_NOT_FOUND");
    }
    
    /*
    *Storing the retrieved password as the user  
    */
    const user = result.rows[0];

    const isMatch = await comparePassword(currentPassword,user.password_hash);

    if(!isMatch){
        throw new AppError("Current password is incorrect",401,"INVALID_CURRENT_PASSWORD");
    }

    /*
    *Hashing the new password that is gonna be updated by the user
    */
    const hashedPassword = await hashPassword(newPassword);

    await db.query(`UPDATE users 
            SET password_hash=$1,
            password_changed_at=NOW(),
            updated_at=NOW()
            WHERE id=$2`,[hashedPassword,userID]
        );
    
    return true;
}

module.exports={
    getUserByID,
    updateUserByID,
    changePassword
}