const db = require("../../config/database");


//Writing the function to retrieve the user detiails with the help of user id 
async function getUserByID(userID) {

    //Writing the db query
    const result = db.query(
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

    if((await result).rows.length===0){
        throw new Error("User not found");
    }
    
    //Returning the user info if the user is found
    return (await result).rows[0];
}

module.exports={
    getUserByID,
}