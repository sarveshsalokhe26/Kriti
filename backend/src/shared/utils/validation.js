/**
 * Input Validation Schemas for Auth Module
 * Validates signup, login, password reset, and OTP verification requests
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (10-15 digits, with optional +, spaces, hyphens)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 * @param {string} password
 * @returns {object} { isValid, errors: [] }
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name (3-50 characters, no special characters except spaces)
 * @param {string} name
 * @returns {boolean}
 */
function isValidName(name) {
  const nameRegex = /^[a-zA-Z\s]{3,50}$/;
  return nameRegex.test(name);
}

/**
 * Validate OTP (6 digits)
 * @param {string} otp
 * @returns {boolean}
 */
function isValidOTP(otp) {
  const otpRegex = /^[0-9]{6}$/;
  return otpRegex.test(otp);
}

/**
 * Validate signup request
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validateSignup(body) {
  const errors = {};

  /*
  *Name validation 
  */
  if (!body.name || !isValidName(body.name)) {
    errors.name = "Name must be 3-50 characters and contain only letters and spaces";
  }

  /*
   *Email or phone validation (at least one required)
  */
  const hasEmail = body.email && isValidEmail(body.email);
  const hasPhone = body.phone && isValidPhone(body.phone);

  if (!hasEmail && !hasPhone) {
    errors.contact = "Either a valid email or phone number is required";
  }

  if (hasEmail && hasPhone) {
    errors.contact = "Provide either email or phone, not both";
  }

  /*
  *Password validation 
  */
  if (!body.password) {
    errors.password = "Password is required";
  } else {
    const passwordCheck = validatePasswordStrength(body.password);
    if (!passwordCheck.isValid) {
      errors.password = passwordCheck.errors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login request
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validateLogin(body) {
  const errors = {};

  // Email or phone validation
  const hasEmail = body.email && isValidEmail(body.email);
  const hasPhone = body.phone && isValidPhone(body.phone);

  if (!hasEmail && !hasPhone) {
    errors.contact = "Either a valid email or phone number is required";
  }

  // Password validation
  if (!body.password) {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate OTP request
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validateOTPRequest(body) {
  const errors = {};

  // Email or phone validation
  const hasEmail = body.email && isValidEmail(body.email);
  const hasPhone = body.phone && isValidPhone(body.phone);

  if (!hasEmail && !hasPhone) {
    errors.contact = "Either a valid email or phone number is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate OTP verification
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validateOTPVerification(body) {
  const errors = {};

  // Email or phone validation
  const hasEmail = body.email && isValidEmail(body.email);
  const hasPhone = body.phone && isValidPhone(body.phone);

  if (!hasEmail && !hasPhone) {
    errors.contact = "Either a valid email or phone number is required";
  }

  // OTP validation
  if (!body.otp || !isValidOTP(body.otp)) {
    errors.otp = "OTP must be a 6-digit number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate password reset request
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validatePasswordResetRequest(body) {
  const errors = {};

  // Email or phone validation
  const hasEmail = body.email && isValidEmail(body.email);
  const hasPhone = body.phone && isValidPhone(body.phone);

  if (!hasEmail && !hasPhone) {
    errors.contact = "Either a valid email or phone number is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate password reset confirmation
 * @param {object} body
 * @returns {object} { isValid, errors: {} }
 */
function validatePasswordResetConfirm(body) {
  const errors = {};

  // OTP validation
  if (!body.otp || !isValidOTP(body.otp)) {
    errors.otp = "OTP must be a 6-digit number";
  }

  // New password validation
  if (!body.newPassword) {
    errors.newPassword = "New password is required";
  } else {
    const passwordCheck = validatePasswordStrength(body.newPassword);
    if (!passwordCheck.isValid) {
      errors.newPassword = passwordCheck.errors;
    }
  }

  // Token validation
  if (!body.resetToken) {
    errors.resetToken = "Reset token is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidOTP,
  validatePasswordStrength,
  validateSignup,
  validateLogin,
  validateOTPRequest,
  validateOTPVerification,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
};