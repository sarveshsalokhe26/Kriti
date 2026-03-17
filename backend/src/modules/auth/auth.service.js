const authRepository = require("./auth.repository");
const {hashPassword} = require("../../shared/utils/passwordHashing")
const {logger} = require("../../shared/logger/logger") 
const {generateOTP,hashOTP,compareOTP,isOTPExpired,getOTPExpiry}=require("../../shared/utils/otp");
const db = require("../../config/database");
const {generateToken} = require("../../shared/utils/jwtTokens");
const {comparePassword}= require("../../shared/utils/passwordHashing");
const AppError = require("../../shared/errors/appError");
const crypto = require("crypto");

/*
 *USER SIGNUP
*/
async function signup({email,password,name,phone,signupsource}) {
    /*
    *Logging the signup attempt 
    */
    logger.info(`Signup attempt under progress`);

    
    /*
    *Error Handle: If the email or phone number is not provided 
    */
    if(!email && !phone){
        throw new AppError("Email or phone is required",400,"MISSING_IDENTIFIER")
    }
    
    /*
    *Error handle: If both email and phone number are provided 
    */
    if(email && phone){
        throw new AppError("Either Email or Phone is required,Not both.",400,"MULTIPLE_IDENTIFIERS");
    }

    /*
    *Error handle: Email already registered 
    */
    if(email){
        const existingEmailUser = await authRepository.findByEmail(email);
        if(existingEmailUser){
            logger.warn(`Signup blocked - Email alreay exists:${email}`);
            throw new AppError("Email already exists",400,"EXISTING_USER");
        }
    }

    /*
    *Error handle: Phone alredy exists
    */ 
    if(phone){
        const existingPhoneUser = await authRepository.findByEmail(phone);
        if(existingPhoneUser){
            logger.warn(`Signup blocked - Phone number alreay exists:${phone}`);
            throw new AppError("Phone already exists",400,"EXISTING_USER")
        }
    }


    /*
    *Hashing password: before we register the user in our database 
    */
    const hashedPassword = await hashPassword(password);

    /*
    *CREATING THE USER:  stroring the user data in the database
    */
    const user = await authRepository.createUser({
        email,
        passwordHash:hashedPassword,
        name,
        phone,
        signupsource,
    });

    /*
    *Logging the user credentials  
    */
    logger.info(`User created successfully with id: ${user.id}`);

    /*
    *Deleting the password before returning the user 
    */ 
    delete user.password;

    /*
    *Returning the user credentials after the user has been created successfully 
    */
    return user;
}


/*
 *Generating verfication OTP
*/
async function createVerificationOTP({ email, phone }) {
  /*
  *Checking whether the USER IS VERIFIED OR NOT. 
  */
  const userRes = await db.query(
    `SELECT id, is_verified FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  
  /*
  *Error handle: if the USER DOES NOT EXIST we return an error.
  */
  if (!user){
    throw new AppError("User not found",400,"USER_DOESN'T_EXIST")
  }
  
  /*
  *If the user is already verified we return back  
  */
  if (user.is_verified) return; 
  
  /*
  *Generating a OTP and hasing the otp  
  */
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  
  /*
  *Inserting the userID, otp_hash, otp_expires_at into the auth_otps table
  */
  const insertRes = await db.query(
    `INSERT INTO auth_otps (user_id, otp_hash, purpose, expires_at)
     VALUES ($1, $2, 'signup', $3)`,
    [user.id, otpHash, getOTPExpiry()]
  );

  /*
  *Logging if the otp is successfully generated and stored in the atuh_otp tables 
  */ 
  console.log("The otp is generated successfully");
}


/*
*OTP VERIFICATION SERVICE; 
*/
async function verifyUserOTP({ email, phone, otp }){

  /*
  *Retrieving the userID from the respective email or phone  
  */
  const userRes = await db.query(
    `SELECT id FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  
  /*
  *Error Handle: If the user not found we return an error 
  */
  if (!user){
    throw new AppError("User not found");
  }
  
  /*
  *Retrieving the data from auth_otps  
  */
  const otpRes = await db.query(
    `SELECT * FROM auth_otps
     WHERE user_id = $1 AND purpose = 'signup'
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );
  
  /*
  *Storing the retrieved data from auth_otps in record variable
  */
  const record = otpRes.rows[0];
  
  /*
  *Error handle: Returning an error if the otp does not exist 
  */
  if (!record){
    throw new AppError("OTP not found");
  }
  
  /*
  *Error handle: Returning an error if the otp expires
  */
  if (isOTPExpired(record.expires_at)) {
    throw new AppError("OTP expired");
  }
  
  /*
  *Rate limiting: Throwing an error if the user attempts for multiple otps at the same time
  */
  if (record.attempts >= Number(process.env.OTP_MAX_ATTEMPTS || 5)) {
    throw new AppError("Too many attempts");
  }
  
  /*
  *Comparing the otp provided by the user and the generated hashed otp  
  */
  const match = await compareOTP(otp, record.otp_hash);
  
  /*
  *IF the generated otp and the hashed otp does not match we return an error 
  */
  if (!match) {
    await db.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    throw new AppError("Invalid OTP");
  }
  
  /*
  *IF the otps match we mark the USER VERIFIED 
  */
  await db.query(`UPDATE users SET is_verified = true WHERE id = $1`, [
    user.id,
  ]);
  
  /*
  *Deleting the stored otp from the database 
  */
  await db.query(`DELETE FROM auth_otps WHERE id = $1`, [record.id]);
}


/*
*LOGIN SERVICE
*/
async function loginUser({email,phone,password}) {

  /*
  *Retrieving the userData from the provided email or phone
  */
  const loginRes= await db.query(
    `SELECT id,password_hash,is_verified
     FROM users
     WHERE email=$1 or phone=$2`,
     [email || null , phone||null]  
  );
  
  
  /*
  *Storing the retrieved users Credentilals in variable: user 
  */
  const user = loginRes.rows[0];

  /*
  *Error Handle: user not found
  */
  if(!user){
    throw new AppError("Invalid credentials");
  }

  /*
  *Error Handle: Account not verified
  */ 
  if(!user.is_verified){
    throw new AppError("Account not verified");
  }
  
  /*
  *Comparing the provided password with password hash 
  */
  const passwordMatch = await comparePassword(password,user.password_hash);
  
  /*
  *Error Handle: Invalid password
  */
  if(!passwordMatch){
    throw new AppError("Invalid password")
  }

  /*
  *Generating access and refresh tokens 
  */
  const token = generateToken({userId:user.id});
  const refreshToken = generateRefreshToken({userId:user.id});
  
  /*
  *Hashing the refresh token  
  */
  const tokenHash = crypto
  .createHash("sha256")
  .update(refreshToken)
  .digest("hex");
  
  /*
  *Storing the hashed refresh tokens 
  */
  await db.query(
  `
  INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
  VALUES ($1, $2, NOW() + INTERVAL '7 days')
  `,
  [user.id, tokenHash]
  );
  
  /*
  *Updating the last_login_at data 
  */
  await db.query(
    `UPDATE users 
     SET last_login_at = NOW() 
     WHERE id = $1`,
    [user.id]
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    },
  };
}



module.exports ={
    signup,
    createVerificationOTP,
    verifyUserOTP,
    loginUser
};