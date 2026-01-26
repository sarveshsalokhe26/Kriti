const pool = require("../../config/database");

/**
 * Find user by email
 */
async function findByEmail(email) {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

/**
 * Find user by phone
 */
async function findByPhone(phone) {
  const query = `
    SELECT *
    FROM users
    WHERE phone = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [phone]);
  return rows[0] || null;
}

/**
 * Create new user
 */
async function createUser({
  email,
  phone,
  passwordHash,
  name,
  signupSource,
}) {
  const query = `
    INSERT INTO users (
      id,
      email,
      phone,
      password_hash,
      name,
      signup_source,
      is_verified,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      $4,
      $5,
      false,
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const values = [
    email || null,
    phone || null,
    passwordHash,
    name,
    signupSource,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  findByEmail,
  findByPhone,
  createUser,
};
