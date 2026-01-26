const { Pool } = require("pg");
const config = require("./index"); // your config.js

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  ssl: config.db.ssl,
});

/**
 * Optional: verify connection on startup
 */
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error", err);
  process.exit(1);
});

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ DB test success:", result.rows[0]);
  } catch (err) {
    console.error("❌ DB test failed:", err.message);
  }
})();


module.exports = pool;
