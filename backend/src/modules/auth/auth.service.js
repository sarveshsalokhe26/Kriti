//creating an auth service to create an user 
const authRepository = require("./auth.repository");
const {hashPassword} = require("../../shared/utils/passwordHashing")
const {logger} = require("../../shared/logger/logger") //importing the logger function to log the important details

//creating a function to create an user
async function signup({email,password,name,phone,signupsource}) {
    //logging the signup attempt
    logger.info(`Signup attempt under progress`);

    //throwing error if user doesn't enter neither email nor phone number at least a singlle of it is required
    if(!email && !phone){
        const error = new Error("Email or Phone number is required");
        error.statusCode=400;
        throw error;
    }
    
    //throwing error if user enters both email and password
    if(email && phone){
        const error = new Error("Either Email or Phone number is required,Not Both");
        error.statusCode=400;
        throw error;
    }

    //checking if the email already exists 
    if(email){
        const existingEmailUser = await authRepository.findByEmail(email);
        if(existingEmailUser){
            logger.warn(`Signup blocked - Email alreay exists:${email}`);
            const error = new Error("User already exists with this email");
            error.statusCode=409;
            throw error;
        }
    }

    //checking if the phone number already exists 
    if(phone){
        const existingPhoneUser = await authRepository.findByEmail(phone);
        if(existingEmailUser){
            logger.warn(`Signup blocked - Phone number alreay exists:${phone}`);
            const error = new Error("User already exists with this phone number");
            error.statusCode=409;
            throw error;
        }
    }


    //hasing password before creating user 
    const hashedPassword = await hashPassword(password);

    //creating the user with the provided credentials
    const user = await authRepository.createUser({
        email,
        passwordHash:hashedPassword,
        name,
        phone,
        signupsource,
    });

    //logging the creation of user 
    logger.info(`User created successfully with id: ${user.id}`);

    //deleting the hashed password 
    delete user.password;

    //now returning the user after the user has been created
    return user;
}

module.exports ={
    signup,
};