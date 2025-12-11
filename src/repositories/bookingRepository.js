// src/repositories/bookingRepository.js
const { pool } = require("../config/db");

function getExecutor(client) {
  return client || pool;
}

/**
 * Create a new booking (usually PENDING initially).
 * @param {Object} bookingData
 * @param {string} bookingData.slot_id
 * @param {string} bookingData.user_id
 * @param {number} bookingData.num_seats
 * @param {string} bookingData.status - 'PENDING' | 'CONFIRMED' | 'FAILED'
 * @param {string} bookingData.expires_at - ISO timestamp
 * @param {Object} [client]
 */
async function createBooking(bookingData, client) {
  const executor = getExecutor(client);

  const {
    slot_id,
    user_id,
    num_seats,
    status,
    expires_at,
  } = bookingData;

  const queryText = `
    INSERT INTO bookings
      (slot_id, user_id, num_seats, status, expires_at)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id,
      slot_id,
      user_id,
      num_seats,
      status,
      expires_at,
      created_at,
      updated_at;
  `;

  const params = [slot_id, user_id, num_seats, status, expires_at];

  const { rows } = await executor.query(queryText, params);
  return rows[0];
}

/**
 * Update booking status (and optionally expires_at).
 * @param {string} bookingId
 * @param {string} status
 * @param {Object} [client]
 */
async function updateBookingStatus(bookingId, status, client) {
  const executor = getExecutor(client);

  const queryText = `
    UPDATE bookings
    SET status = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      slot_id,
      user_id,
      num_seats,
      status,
      expires_at,
      created_at,
      updated_at;
  `;

  const params = [status, bookingId];

  const { rows } = await executor.query(queryText, params);
  return rows[0] || null;
}

/**
 * Get booking by ID.
 * @param {string} bookingId
 * @param {Object} [client]
 */
async function getBookingById(bookingId, client) {
  const executor = getExecutor(client);

  const queryText = `
    SELECT
      id,
      slot_id,
      user_id,
      num_seats,
      status,
      expires_at,
      created_at,
      updated_at
    FROM bookings
    WHERE id = $1;
  `;

  const { rows } = await executor.query(queryText, [bookingId]);
  return rows[0] || null;
}

async function getBookingByIdForUpdate(bookingId, client) {
  if (!client) {
    throw new Error("getBookingByIdForUpdate requires a transaction client");
  }

  const queryText = `
    SELECT
      id,
      slot_id,
      user_id,
      num_seats,
      status,
      expires_at,
      created_at,
      updated_at
    FROM bookings
    WHERE id = $1
    FOR UPDATE;
  `;

  const { rows } = await client.query(queryText, [bookingId]);
  return rows[0] || null;


if (booking.status === "PENDING") {
      const expiresAt = new Date(booking.expires_at);
      const now = new Date();
      if (expiresAt.getTime() < now.getTime()) {
        // Update status to FAILED inside the transaction
        const failedBooking = await bookingRepository.updateBookingStatus(bookingId, "FAILED", client);
        return failedBooking;
      }
    
}
}
    /*return booking;


/**
 * List bookings for a specific user (optionally filtered by status).
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.status]
 * @param {Object} [client]
 */
async function listBookingsByUser(userId, options = {}, client) {
  const executor = getExecutor(client);
  const params = [userId];
  let paramIndex = 2;

  let queryText = `
    SELECT
      id,
      slot_id,
      user_id,
      num_seats,
      status,
      expires_at,
      created_at,
      updated_at
    FROM bookings
    WHERE user_id = $1
  `;

  if (options.status) {
    queryText += ` AND status = $${paramIndex++}`;
    params.push(options.status);
  }

  queryText += `
    ORDER BY created_at DESC;
  `;

  const { rows } = await executor.query(queryText, params);
  return rows;
}

async function expirePendingBookings(client) {
  const executor = client || pool;

  const queryText = `
    UPDATE bookings
    SET status = 'FAILED', updated_at = NOW()
    WHERE status = 'PENDING'
      AND expires_at < NOW()
    RETURNING *;
  `;

  const { rows } = await executor.query(queryText);
  return rows; // list of expired bookings
}


module.exports = {
  createBooking,
  updateBookingStatus,
  getBookingById,
  listBookingsByUser,
  expirePendingBookings,
getBookingByIdForUpdate,
};
