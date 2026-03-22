# Kriti Authentication API Documentation

## Overview

Complete authentication system with JWT-based token management, OTP verification, and password reset functionality.

---

## Authentication Flow

### 1. User Registration (Signup)
```
User → Signup → Receive OTP → Verify OTP → Account Created
```

### 2. User Login
```
User → Login → Receive Access & Refresh Tokens → Authenticated
```

### 3. Token Refresh
```
Expired Access Token + Valid Refresh Token → New Access Token
```

### 4. Password Reset
```
Forgot Password → Request Reset → Receive OTP → Verify OTP → New Password Set
```

---

## API Endpoints

### 1. POST `/auth/signup`
Register a new user account.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": null,
  "password": "SecurePass@123"
}
```

**Validation Rules:**
- `name`: 3-50 characters, letters and spaces only
- `email` OR `phone`: At least one required, not both
  - Email: Valid email format
  - Phone: 10-15 digits with optional +, spaces, hyphens
- `password`: Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*()_+-=[]{}';:"\\|,.<>/?)

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully. Please verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": null,
      "is_verified": false,
      "created_at": "2026-03-09T..."
    }
  },
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **400** - Validation failed
  ```json
  {
    "success": false,
    "statusCode": 400,
    "error": {
      "code": "VAL_001",
      "message": "Validation failed",
      "details": {
        "contact": "Either a valid email or phone number is required"
      }
    }
  }
  ```

- **409** - User already exists
  ```json
  {
    "success": false,
    "statusCode": 409,
    "error": {
      "code": "CONFLICT_001",
      "message": "User already exists with this email"
    }
  }
  ```

---

### 2. POST `/auth/request-verification`
Request OTP for account verification.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

Or with phone:
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Verification OTP sent to your email/phone",
  "data": {},
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **400** - Validation failed or invalid identifier
- **404** - User not found

---

### 3. POST `/auth/verify-otp`
Verify OTP and complete account verification.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

Or with phone:
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Validation Rules:**
- `otp`: Exactly 6 digits

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Account verified successfully",
  "data": {},
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **400** - Invalid OTP format
- **401** - Invalid or expired OTP
  ```json
  {
    "success": false,
    "statusCode": 401,
    "error": {
      "code": "AUTH_007",
      "message": "Invalid OTP"
    }
  }
  ```
- **429** - Too many attempts

---

### 4. POST `/auth/login`
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

Or with phone:
```json
{
  "phone": "+919876543210",
  "password": "SecurePass@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "phone": null,
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-03-09T..."
    }
  },
  "timestamp": "2026-03-09T..."
}
```

**Token Details:**
- **accessToken**: Short-lived (1 hour), use for API requests
- **refreshToken**: Long-lived (7 days), use to get new access tokens

**Error Responses:**
- **400** - Validation failed
- **401** - Invalid credentials or account not verified
  ```json
  {
    "success": false,
    "statusCode": 401,
    "error": {
      "code": "AUTH_001",
      "message": "Invalid email/phone or password"
    }
  }
  ```

---

### 5. POST `/auth/refresh-token`
Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **400** - Refresh token missing
- **401** - Invalid or expired refresh token

---

### 6. POST `/auth/request-password-reset`
Request OTP for password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

Or with phone:
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If an account exists, password reset instructions will be sent",
  "data": {},
  "timestamp": "2026-03-09T..."
}
```

**Note:** Response is same whether account exists or not (security best practice)

---

### 7. POST `/auth/reset-password`
Reset password with OTP verification.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass@456"
}
```

Or with phone:
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "newPassword": "NewSecurePass@456"
}
```

**Validation Rules:**
- `otp`: Exactly 6 digits
- `newPassword`: Same rules as signup password

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {},
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **400** - Validation failed
- **401** - Invalid or expired OTP
- **429** - Too many attempts

---

### 8. GET `/auth/me`
Get current authenticated user info.

**Request Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User authenticated successfully",
  "data": {
    "userId": "uuid"
  },
  "timestamp": "2026-03-09T..."
}
```

**Error Responses:**
- **401** - Invalid or missing token

---

### 9. POST `/auth/logout`
Logout current user.

**Request Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": {},
  "timestamp": "2026-03-09T..."
}
```

---

## Error Codes Reference

### Validation Errors (400)
- `VAL_001`: Invalid input provided
- `VAL_002`: Missing required fields

### Authentication Errors (401)
- `AUTH_001`: Invalid email/phone
- `AUTH_002`: Invalid password
- `AUTH_003`: Authorization header missing
- `AUTH_004`: Invalid or expired token
- `AUTH_005`: Token required
- `AUTH_006`: Account not verified or insufficient permissions
- `AUTH_007`: Invalid OTP
- `AUTH_008`: OTP expired

### Conflict Errors (409)
- `CONFLICT_001`: User already exists with this email
- `CONFLICT_002`: User already exists with this phone

### Not Found Errors (404)
- `NOT_FOUND_001`: User not found
- `NOT_FOUND_002`: OTP not found

### Rate Limiting (429)
- `RATE_LIMIT_001`: Too many attempts

### Server Errors (500)
- `SERVER_001`: Internal server error

---

## Authentication Best Practices

### 1. Token Storage (Client-Side)
```javascript
// Store accessToken in memory or sessionStorage (not localStorage)
// Store refreshToken in httpOnly cookie (if possible) or secure storage
```

### 2. Using Access Tokens
```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
fetch('/api/endpoint', { headers });
```

### 3. Handling Token Expiration
```javascript
// When you get 401 response:
// 1. Use refreshToken to get new accessToken
// 2. Retry original request with new token
// 3. If refreshToken is invalid, redirect to login
```

### 4. Environment Variables
```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_ISSUER=kriti-app
JWT_AUDIENCE=kriti-users

OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
PASSWORD_RESET_EXPIRY_MINUTES=30
MAX_CONCURRENT_SESSIONS=5
```

---

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Request Verification
```bash
curl -X POST http://localhost:3000/auth/request-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Implementation Checklist

- [x] Signup with email/phone
- [x] OTP generation and verification
- [x] Login with JWT tokens (access + refresh)
- [x] Password reset with OTP
- [x] Token refresh mechanism
- [x] Account verification
- [x] Input validation
- [x] Error handling with standard codes
- [x] Logging for audit trail
- [ ] Email/SMS service integration
- [ ] Rate limiting middleware
- [ ] Token blacklist (Redis)
- [ ] Session management
- [ ] Two-factor authentication (2FA)
- [ ] Social login integration
- [ ] API documentation (Swagger)

---

## Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'user',
  signup_source VARCHAR(50),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### auth_otps table
```sql
CREATE TABLE auth_otps (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  otp_hash VARCHAR(255),
  purpose VARCHAR(50),
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security Considerations

1. **Password Storage**: Uses bcrypt with 12 salt rounds
2. **OTP Hashing**: OTP values are hashed before storage
3. **Token Expiry**: Access tokens are short-lived (1 hour)
4. **HTTPS Only**: Always use HTTPS in production
5. **CORS**: Configure CORS policies appropriately
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Audit Logging**: All auth events are logged
8. **Secret Management**: Use environment variables for secrets
9. **Input Validation**: All inputs are validated before processing
10. **SQL Injection**: Using parameterized queries to prevent SQL injection

---
