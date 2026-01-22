const bcrypt=require("bcrypt");
const SALT_ROUNDS=12;

//writing a function to hash the password given by the user
async function hashPassword(password) {
    return bcrypt.hash(password,SALT_ROUNDS);
}

//writing a function to compare the password with hashed value of the password
async function comparePassword(password,hash) {
    return bcrypt.compare(password,hash);
}

//exporting the functions for further use
module.exports={
    hashPassword,
    comparePassword,
}