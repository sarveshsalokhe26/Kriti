const authRepository = require("./auth.repository");
const {hashPassword} = require("../../shared/utils/passwordHashing")
const {logger} = require("../../shared/logger/logger") 
const {generateOTP,hashOTP,compareOTP,isOTPExpired,getOTPExpiry}=require("../../shared/utils/otp");
const db = require("../../config/database");
const {generateToken} = require("../../shared/utils/jwtTokens");
const {comparePassword}= require("../../shared/utils/passwordHashing");

/*
 *User Creation
*/
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


/*
 *Generating verfication OTP
*/
async function createVerificationOTP({ email, phone }) {
  const userRes = await db.query(
    `SELECT id, is_verified FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) throw new Error("User not found"); //throwing error if the user does not exist
  if (user.is_verified) return; //returning bac if the user is already verified

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  const insertRes = await db.query(
    `INSERT INTO auth_otps (user_id, otp_hash, purpose, expires_at)
     VALUES ($1, $2, 'signup', $3)`,
    [user.id, otpHash, getOTPExpiry()]
  );

  //logging whether the user is actually inserted into the db or not 
  console.log("The user is inserted successfully:");
}


async function verifyUserOTP({ email, phone, otp }) {
  const userRes = await db.query(
    `SELECT id FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) throw new Error("User not found");

  const otpRes = await db.query(
    `SELECT * FROM auth_otps
     WHERE user_id = $1 AND purpose = 'signup'
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );

  const record = otpRes.rows[0];
  if (!record) throw new Error("OTP not found");

  if (isOTPExpired(record.expires_at)) {
    throw new Error("OTP expired");
  }

  if (record.attempts >= Number(process.env.OTP_MAX_ATTEMPTS || 5)) {
    throw new Error("Too many attempts");
  }

  const match = await compareOTP(otp, record.otp_hash);
  if (!match) {
    await db.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    throw new Error("Invalid OTP");
  }

  await db.query(`UPDATE users SET is_verified = true WHERE id = $1`, [
    user.id,
  ]);

  await db.query(`DELETE FROM auth_otps WHERE id = $1`, [record.id]);
}

/*
 *Login Service
*/
async function loginUser({email,phone,password}) {
  const loginRes= await db.query(
    `SELECT id,password_hash,is_verified
     FROM users
     WHERE email=$1 or phone=$2`,
     [email || null , phone||null]  
  );
  
  //returning the user cred
  const user = loginRes.rows[0];

  //returning error id the user does not exist 
  if(!user){
    throw new Error("Invalid credentials");
  }

  //throwing error if user is not verified 
  if(!user.is_verified){
    throw new Error("Account not verified");
  }

  const passwordMatch = await comparePassword(password,user.password_hash);
  
  //throwin error if invalid password
  if(!passwordMatch){
    throw new Error("Invalid password")
  }

  //if password is correct returning a jwt token
  return generateToken({userId:user.id});
}



module.exports ={
    signup,
    createVerificationOTP,
    verifyUserOTP,
    loginUser
};