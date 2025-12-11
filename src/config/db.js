const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

// Helper for database queries (simple use)
const query = (text, params) => pool.query(text, params);

// Transaction wrapper for concurrency-safe booking logic
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};
