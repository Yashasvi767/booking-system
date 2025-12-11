// src/services/slotService.js
const slotRepository = require("../repositories/slotRepository");

/**
 * Create a new slot (doctor appointment).
 * Handles any extra validation / normalization not tied to HTTP.
 */
async function createSlot(data) {
  const {
    doctor_name,
    specialization,
    start_time,
    duration_minutes,
    total_capacity,
  } = data;

  // Extra sanity checks (optional but good practice)
  let startTimeObj = new Date(start_time);
  if (isNaN(startTimeObj.getTime())) {
    const error = new Error("Invalid start_time. Must be a valid ISO datetime string.");
    error.statusCode = 400;
    throw error;
  }

  // Normalize: ensure strings trimmed, etc.
  const slotData = {
    doctor_name: doctor_name.trim(),
    specialization: specialization ? String(specialization).trim() : null,
    start_time: startTimeObj.toISOString(),
    duration_minutes: duration_minutes || null,
    total_capacity,
  };

  // Call repository
  const slot = await slotRepository.createSlot(slotData);

  return slot;
}

/**
 * List slots with filters. Used by both admin + user controllers (if you want).
 */
async function listSlots(filters = {}) {
  const normalizedFilters = { ...filters };

  // Optionally: validate filter dates
  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (isNaN(fromDate.getTime())) {
      const error = new Error("Invalid 'from' filter. Must be a valid date.");
      error.statusCode = 400;
      throw error;
    }
    normalizedFilters.from = fromDate.toISOString();
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    if (isNaN(toDate.getTime())) {
      const error = new Error("Invalid 'to' filter. Must be a valid date.");
      error.statusCode = 400;
      throw error;
    }
    normalizedFilters.to = toDate.toISOString();
  }

  const slots = await slotRepository.listSlots(normalizedFilters);
  return slots;
}

async function listAvailableSlotsForUsers(filters = {}) {
  const { doctor_name, specialization, date } = filters;

  const now = new Date();

  const repoFilters = {
    doctor_name: doctor_name || undefined,
    specialization: specialization || undefined,
    onlyAvailable: true, // key flag
  };

  if (date) {
    // If a specific date is provided, show slots for that date only
    const day = new Date(date);
    if (isNaN(day.getTime())) {
      const error = new Error("Invalid 'date' filter. Must be a valid date (YYYY-MM-DD).");
      error.statusCode = 400;
      throw error;
    }

    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    repoFilters.from = startOfDay.toISOString();
    repoFilters.to = endOfDay.toISOString();
  } else {
    // No date filter -> show only future slots
    repoFilters.from = now.toISOString();
  }

  console.log("slotService.listAvailableSlotsForUsers -> repoFilters:", repoFilters);
  const slots = await slotRepository.listSlots(repoFilters);
  return slots;
}

module.exports = {
  createSlot,
  listSlots,
  listAvailableSlotsForUsers,
};
