const { Pool } = require("pg");
const logger = require("../shared/logger/logger");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on("connect", () => {
  logger.info("PostgreSQL connected");
});

pool.on("error", (err) => {
  logger.error("PostgreSQL connection error");
  logger.error(err.message);
  process.exit(1); // crash app if DB is broken
});

module.exports = pool;