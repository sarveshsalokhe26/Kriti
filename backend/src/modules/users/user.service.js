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

/*
 * Updating the user partially
 */
async function updateUserByID(userID,data) {
    //writing the allowed fileds that can be edited
    const allowedFields = ["name"];
    const updates = [];
    const values = []; //array for storing the changes that need to be done 
    let paramIndex = 1;
    
    //for now only names field is allowed to be updated 
    for(const field of allowedFields){
        if(data[field]!==undefined){
            updates.push(`${field}=$${paramIndex}`)
            values.push(data[field]) //pushing the values in the values array  
            paramIndex++;
        }
    }

    //Handling the error if no valid fields are provided 
    if(values.length===0){
        throw new Error("No valid fields provided fo the updates");
    }
    
    values.push(userID); //it is stored at an index of 2 in the values array but the postgres treats it as 3

    const result = await db.query(
        `UPDATE users
         SET ${updates.join(", ")},updated_at=NOW()
         WHERE id = $${paramIndex}
         RETURNING id,email,phone,name,is_verified,created_at
        `,values
    )
    
    //returning the updated data 
    return result.rows[0];

} 

module.exports={
    getUserByID,
    updateUserByID
}