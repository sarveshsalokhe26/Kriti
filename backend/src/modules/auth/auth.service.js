const authRepository = require("./auth.repository");

/*
 *Password hashing functions [Utilities]
 *1.hashPassword, Hashes the password 
 *2.comparePassword, Comparing the hashed passwords
*/
const { hashPassword, comparePassword } = require("../../shared/utils/passwordHashing");

/*
 *WINSTON LOGGING
 *logs the important details for better debugging
 *1.logger
*/
const { logger } = require("../../shared/logger/logger");

/*
 *OTP UTILITIES
 *1.generateOTP, This function generates a random otp
 *2.hashOTP, Hashes the generated otp
 *3.compareOTP, Compares the hashed otp
 *4.isOTPExpired, Validates whether the given otp is expired or not 
 *5.getOTPExpiry, Retrieves the otp expiry details 
*/
const {generateOTP, hashOTP, compareOTP, isOTPExpired, getOTPExpiry,} = require("../../shared/utils/otp");

/*
 *Password strength validation
 *1.validatePasswordStrength
*/
const { validatePasswordStrength,} = require("../../shared/utils/validation");

/*
 *Database connection 
*/
const db = require("../../config/database");

/*
 *JWT TOKENS
 *1.generateAccessToken, Generates the access token 
 *2.generateRefreshToken, Generates the refresh token 
 *3.generateTokenPair,
 *4.verifyRefreshToken, verifies the refresh tokens
*/
const {generateAccessToken, generateRefreshToken, generateTokenPair,verifyRefreshToken,} = require("../../shared/utils/jwtTokens");

/*
 *ERROR HANDLER
 *1.createError, Generates an new error
 *2.createValidationError, Generates the validation error 
*/ 
const {createError, createValidationError,} = require("../../shared/errors/errorHandler");



/*
*AUTH SERVICES 
*/



/**
 * USER SIGNUP
 * Creates new user account with email or phone
 * Parameters {object} data - { email, phone, password, name, signupsource }
 * Returns {object} User object (without password)
*/
async function signup({email, password, name, phone, signupsource = "app",}) {

  logger.info("Signup attempt", { email, phone, name });

  /*
   *Validating at least one contact method
   *Validation case: IF user provides neither email nor phone we throw an error 
  */
  if (!email && !phone) {
    throw createError(
      "VAL_001",
      "Email or phone number is required"
    );
  }

  /*
   *Alowing a single signup method
   *Validation case: If user provides both email and phone we throw an error
  */
  if (email && phone) {
    throw createError(
      "VAL_001",
      "Provide either email or phone, not both"
    );
  }

  /*
   *Password validation
   *Validation case: If the password if not strong enough we throw an error
  */
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw createValidationError({
      password: passwordValidation.errors,
    });
  }

  /*
   *Existing user
   *Conflict case: User already registered with provided Email
  */
  if (email) {
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      logger.warn("Signup blocked - Email already exists", { email });
      throw createError(
        "CONFLICT_001",
        "User already exists with this email"
      );
    }
  }

  /*
   *Existing user
   *Conflict case: User already exist with provided phone 
  */
  if (phone) {
    const existingUser = await authRepository.findByPhone(phone);
    if (existingUser) {
      logger.warn("Signup blocked - Phone already exists", { phone });
      throw createError(
        "CONFLICT_002",
        "User already exists with this phone"
      );
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await authRepository.createUser({
    email,
    passwordHash: hashedPassword,
    name,
    phone,
    signupSource: signupsource,
  });

  logger.info("User created successfully", { userId: user.id });

  // Remove sensitive fields
  const { password_hash, ...userWithoutPassword } = user;

  return userWithoutPassword;
}





/**
 * CREATE VERIFICATION OTP
 * Generates and stores OTP for email/phone verification
 * Parameters {object} data - { email, phone }
 * Return {void}
 */
async function createVerificationOTP({ email, phone }) {
  logger.info("OTP request", { email, phone });

  /*
   *Find the user 
  */
  const userRes = await db.query(
    `SELECT id, is_verified FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw createError(
      "NOT_FOUND_001",
      "User not found"
    );
  }

  /*
   *Skipping of the user already exists 
  */
  if (user.is_verified) {
    logger.info("User already verified", { userId: user.id });
    return;
  }

  /*
   *Generate OTP 
  */
  const otp = generateOTP();
  logger.info("generated OTP",otp);
  const otpHash = await hashOTP(otp);

  // Store OTP
  await db.query(
    `INSERT INTO auth_otps (user_id, otp_hash, purpose, expires_at, attempts)
     VALUES ($1, $2, 'signup', $3, 0)`,
    [user.id, otpHash, getOTPExpiry()]
  );

  logger.info("OTP created successfully", { userId: user.id });
  
  
  // In production, send OTP via email/SMS here
  // For now, we'll return it for testing (remove in production)
  return { otp, expiresAt: getOTPExpiry() };
}






/**
 * VERIFY OTP 
 * Verifies user's OTP and marks account as verified
 * Parameters {object} data - { email, phone, otp }
 * return {void}
 */
async function verifyUserOTP({ email, phone, otp }) {
  logger.info("OTP verification attempt", { email, phone });

  /*
   *Find the user 
  */
  const userRes = await db.query(
    `SELECT id FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw createError(
      "NOT_FOUND_001",
      "User not found"
    );
  }

  /*
   *Retrieving the latest otp 
  */
  const otpRes = await db.query(
    `SELECT * FROM auth_otps
     WHERE user_id = $1 AND purpose = 'signup'
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );

  const record = otpRes.rows[0];
  if (!record) {
    throw createError(
      "NOT_FOUND_002",
      "OTP not found"
    );
  }

  /*
   *Checking if the otp is expired  
  */
  if (isOTPExpired(record.expires_at)) {
    logger.warn("OTP expired", { userId: user.id });
    throw createError("AUTH_008", "OTP expired");
  }

  /*
   *Checking for multiple attempts 
  */
  if (record.attempts >= 5) {
    logger.warn("Too many OTP attempts", { userId: user.id });
    throw createError(
      "RATE_LIMIT_001",
      "Too many attempts. Please request a new OTP"
    );
  }

  /*
   *Comparing the OTPS 
  */
  const match = await compareOTP(otp, record.otp_hash);
  if (!match) {
    /*
     *Incrementing attempts     
    */
    await db.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    logger.warn("Invalid OTP provided", { userId: user.id });
    throw createError("AUTH_007", "Invalid OTP");
  }

  /*
   *Marking user as verifiedf
  */
  await db.query(`UPDATE users SET is_verified = true WHERE id = $1`, [
    user.id,
  ]);

  /*
   *Deleting the otp 
  */
  await db.query(`DELETE FROM auth_otps WHERE id = $1`, [record.id]);

  logger.info("User verified successfully", { userId: user.id });
}





/**
 * LOGIN USER
 * Authenticates user and returns access & refresh tokens
 * Parameters {object} data - { email, phone, password }
 * Return {object} { accessToken, refreshToken, user }
 */
async function loginUser({ email, phone, password }) {
  logger.info("Login attempt", { email, phone });

  /*
   *Finding the user 
  */
  const loginRes = await db.query(
    `SELECT id, password_hash, is_verified, email, phone, name, created_at
     FROM users
     WHERE email = $1 OR phone = $2
     LIMIT 1`,
    [email || null, phone || null]
  );

  const user = loginRes.rows[0];
  if (!user) {
    logger.warn("Login failed - user not found", { email, phone });
    throw createError("AUTH_001", "Invalid email/phone or password");
  }

  /*
   *Checking if the user is verified 
  */
  if (!user.is_verified) {
    logger.warn("Login blocked - account not verified", { userId: user.id });
    throw createError(
      "AUTH_006",
      "Account not verified. Please verify your email/phone first"
    );
  }

  /*
   *Comparing the passwords
  */
  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    logger.warn("Login failed - invalid password", { userId: user.id });
    throw createError("AUTH_002", "Invalid email/phone or password");
  }

  /*
   *Generating the jwt tokens  
  */
  const tokens = generateTokenPair({ userId: user.id });

  /*
   *Updating the last_login_value 
  */
  await db.query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
    [user.id]
  );

  logger.info("User logged in successfully", { userId: user.id });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role || "user",
      createdAt: user.created_at,
    },
  };
}





/**
 * REFRESH ACCESS TOKEN
 * Generates new access token using refresh token
 * Parameters {string} refreshToken - Valid refresh token
 * Return {object} { accessToken }
 */
async function refreshAccessToken(refreshToken) {
  logger.info("Token refresh attempt");

  try {
    /*
     *Verify refresh token 
    */
    const decoded = verifyRefreshToken(refreshToken);

    /*
     *varifying if the user still exists 
    */
    const userRes = await db.query(
      `SELECT id FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (!userRes.rows[0]) {
      throw createError(
        "NOT_FOUND_001",
        "User not found"
      );
    }

    /*
     *Generate new access tokens  
    */
    const newAccessToken = generateAccessToken({ userId: decoded.userId });

    logger.info("Token refreshed successfully", { userId: decoded.userId });

    return { accessToken: newAccessToken };
  } catch (error) {
    logger.warn("Token refresh failed", { error: error.message });
    throw createError("AUTH_004", error.message);
  }
}





/**
 * Request Password Reset
 * Generates OTP and sends reset email/SMS
 * Parameters {object} data - { email, phone }
 * return {void}
 */
async function requestPasswordReset({ email, phone }) {
  logger.info("Password reset request", { email, phone });

  /*
   *Finding the user 
  */
  const userRes = await db.query(
    `SELECT id FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) {
    // Don't reveal if user exists (security best practice)
    logger.warn("Password reset requested for non-existent user", {
      email,
      phone,
    });
    return;
  }

  /*
   *Generating OTP 
  */
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  /*
   *Store the reset otp  
  */
  await db.query(
    `INSERT INTO auth_otps (user_id, otp_hash, purpose, expires_at, attempts)
     VALUES ($1, $2, 'password_reset', $3, 0)`,
    [user.id, otpHash, getOTPExpiry()]
  );

  logger.info("Password reset OTP created", { userId: user.id });

    // In production, send OTP via email/SMS
  return { otp, expiresAt: getOTPExpiry() }; // Remove in production
}





/**
 * RESET PASSWORD WITH OTP
 * Verifies OTP and updates password
 * Parameters {object} data - { email, phone, otp, newPassword }
 * Return {void}
 */
async function resetPasswordWithOTP({email, phone, otp, newPassword,}) {
  logger.info("Password reset attempt", { email, phone });

  /*
   *Validate the password strength 
  */
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw createValidationError({
      newPassword: passwordValidation.errors,
    });
  }

  /*
   *Finding the user
  */
  const userRes = await db.query(
    `SELECT id FROM users WHERE email = $1 OR phone = $2`,
    [email || null, phone || null]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw createError(
      "NOT_FOUND_001",
      "User not found"
    );
  }

  /*
   *Getting the latest reset otp 
  */
  const otpRes = await db.query(
    `SELECT * FROM auth_otps
     WHERE user_id = $1 AND purpose = 'password_reset'
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );

  const record = otpRes.rows[0];
  if (!record) {
    throw createError(
      "NOT_FOUND_002",
      "No password reset request found"
    );
  }

  /*
   *Checking if the otp expired  
  */
  if (isOTPExpired(record.expires_at)) {
    throw createError("AUTH_008", "Reset link expired");
  }

  /*
   *Checking the max attempts threshold 
  */
  if (record.attempts >= 5) {
    throw createError(
      "RATE_LIMIT_001",
      "Too many attempts. Please request a new reset"
    );
  }

  /*
   *Comparing the otp  
  */
  const match = await compareOTP(otp, record.otp_hash);
  if (!match) {
    await db.query(
      `UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    throw createError("AUTH_007", "Invalid reset code");
  }

  /**
   *Hashing the new password
   */
  const hashedPassword = await hashPassword(newPassword);

  /*
   *Storing the new password hash  
  */
  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [hashedPassword, user.id]
  );

  /*
   *Deleting the reset OTP  
  */
  await db.query(`DELETE FROM auth_otps WHERE id = $1`, [record.id]);

  logger.info("Password reset successful", { userId: user.id });
}





/**
 * Verify user password for sensitive operations
 * @param {string} userId - User ID
 * @param {string} password - Password to verify
 * @returns {boolean}
 */
async function verifyPassword(userId, password) {
  const userRes = await db.query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw createError(
      "NOT_FOUND_001",
      "User not found"
    );
  }

  return comparePassword(password, user.password_hash);
}

module.exports = {
  signup,
  createVerificationOTP,
  verifyUserOTP,
  loginUser,
  refreshAccessToken,
  requestPasswordReset,
  resetPasswordWithOTP,
  verifyPassword,
};