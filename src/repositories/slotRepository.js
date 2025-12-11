// src/repositories/slotRepository.js
const { pool } = require("../config/db");

// Internal helper: use transaction client if provided, else use pool
function getExecutor(client) {
  return client || pool;
}

async function listSlots(filters = {}, client) {
  const executor = getExecutor(client);

  console.log("listSlots query will run conditions:", conditions, "params:", params);

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.doctor_name) {
    conditions.push(`doctor_name ILIKE $${paramIndex++}`);
    params.push(`%${filters.doctor_name}%`);
  }

  if (filters.specialization) {
    conditions.push(`specialization ILIKE $${paramIndex++}`);
    params.push(`%${filters.specialization}%`);
  }

  if (filters.from) {
    conditions.push(`start_time >= $${paramIndex++}`);
    params.push(filters.from);
  }

  if (filters.to) {
    conditions.push(`start_time <= $${paramIndex++}`);
    params.push(filters.to);
  }

  if (filters.onlyAvailable) {
    conditions.push(`remaining_capacity > 0`);
  }

  let queryText = `
    SELECT
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at
    FROM slots
  `;

  if (conditions.length > 0) {
    queryText += ` WHERE ` + conditions.join(" AND ");
  }

  queryText += ` ORDER BY start_time ASC;`;

  const { rows } = await executor.query(queryText, params);
  return rows;
}

/**
 * Create a new slot (doctor appointment slot).
 * @param {Object} slotData
 * @param {string} slotData.doctor_name
 * @param {string} [slotData.specialization]
 * @param {string} slotData.start_time - ISO timestamp string
 * @param {number} [slotData.duration_minutes]
 * @param {number} slotData.total_capacity
 * @param {Object} [client] - optional pg client for transactions
 */
async function createSlot(slotData, client) {
  const executor = getExecutor(client);

  const {
    doctor_name,
    specialization = null,
    start_time,
    duration_minutes = null,
    total_capacity,
  } = slotData;

  const remaining_capacity = total_capacity;

  const queryText = `
    INSERT INTO slots
      (doctor_name, specialization, start_time, duration_minutes, total_capacity, remaining_capacity)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at;
  `;

  const params = [
    doctor_name,
    specialization,
    start_time,
    duration_minutes,
    total_capacity,
    remaining_capacity,
  ];

  const { rows } = await executor.query(queryText, params);
  return rows[0];
}

/**
 * Get a single slot by ID.
 * @param {string} slotId - UUID
 * @param {Object} [client]
 */
async function getSlotById(slotId, client) {
  const executor = getExecutor(client);

  const queryText = `
    SELECT
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at
    FROM slots
    WHERE id = $1;
  `;

  const { rows } = await executor.query(queryText, [slotId]);
  return rows[0] || null;
}

/**
 * List slots with optional filters.
 * @param {Object} filters
 * @param {string} [filters.doctor_name]
 * @param {string} [filters.specialization]
 * @param {string} [filters.from] - ISO timestamp (start_time >= from)
 * @param {string} [filters.to]   - ISO timestamp (start_time <= to)
 * @param {Object} [client]
 */
async function listSlots(filters = {}, client) {
  const executor = getExecutor(client);

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (filters.doctor_name) {
    conditions.push(`doctor_name ILIKE $${paramIndex++}`);
    params.push(`%${filters.doctor_name}%`);
  }

  if (filters.specialization) {
    conditions.push(`specialization ILIKE $${paramIndex++}`);
    params.push(`%${filters.specialization}%`);
  }

  if (filters.from) {
    conditions.push(`start_time >= $${paramIndex++}`);
    params.push(filters.from);
  }

  if (filters.to) {
    conditions.push(`start_time <= $${paramIndex++}`);
    params.push(filters.to);
  }

  let queryText = `
    SELECT
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at
    FROM slots
  `;

  if (conditions.length > 0) {
    queryText += ` WHERE ` + conditions.join(" AND ");
  }

  queryText += ` ORDER BY start_time ASC;`;

  const { rows } = await executor.query(queryText, params);
  return rows;
}

/**
 * Atomically decrement remaining_capacity for a slot.
 * This is critical for concurrency safety.
 *
 * @param {string} slotId
 * @param {number} numSeats
 * @param {Object} [client] - MUST use a client inside a transaction in bookingService
 * @returns {Object|null} updated slot row or null if not enough capacity
 */
async function decrementRemainingCapacity(slotId, numSeats, client) {
  const executor = getExecutor(client);

  const queryText = `
    UPDATE slots
    SET
      remaining_capacity = remaining_capacity - $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND remaining_capacity >= $1
    RETURNING
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at;
  `;

  const params = [numSeats, slotId];

  const { rows } = await executor.query(queryText, params);
  return rows[0] || null; // null => capacity not enough
}

/**
 * Atomically increment remaining_capacity for a slot (safe).
 * Returns updated slot row or null if update failed (e.g., would exceed total_capacity).
 * @param {string} slotId
 * @param {number} numSeats
 * @param {Object} client - optional pg client (use inside transaction)
 */
async function incrementRemainingCapacity(slotId, numSeats, client) {
  const executor = getExecutor(client);

  const queryText = `
    UPDATE slots
    SET remaining_capacity = remaining_capacity + $1,
        updated_at = NOW()
    WHERE id = $2
      AND (remaining_capacity + $1) <= total_capacity
    RETURNING
      id,
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
      remaining_capacity,
      created_at,
      updated_at;
  `;
  const params = [numSeats, slotId];

  const { rows } = await executor.query(queryText, params);
  return rows[0] || null;
}


module.exports = {
  createSlot,
  getSlotById,
  listSlots,
  decrementRemainingCapacity,
  incrementRemainingCapacity
};
