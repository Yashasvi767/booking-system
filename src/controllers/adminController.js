// src/controllers/adminController.js
const slotService = require("../services/slotService");

// POST /api/admin/slots
async function createSlot(req, res, next) {
  try {
    const {
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
    } = req.body;

    // Basic validation
    const errors = [];

    if (!doctor_name || typeof doctor_name !== "string" || doctor_name.trim() === "") {
      errors.push("doctor_name is required and must be a non-empty string.");
    }

    if (!start_time) {
      errors.push("start_time is required.");
    }

    if (
      total_capacity === undefined ||
      total_capacity === null ||
      typeof total_capacity !== "number" ||
      !Number.isInteger(total_capacity) ||
      total_capacity <= 0
    ) {
      errors.push("total_capacity is required and must be a positive integer.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: errors,
      });
    }

    // Call service layer
    const slot = await slotService.createSlot({
      doctor_name,
      specialization,
      start_time,
      duration_minutes,
      total_capacity,
    });

    return res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/slots
async function listSlots(req, res, next) {
  try {
    const {
      doctor_name,
      specialization,
      from,
      to,
    } = req.query;

    const filters = {
      doctor_name: doctor_name || undefined,
      specialization: specialization || undefined,
      from: from || undefined,
      to: to || undefined,
    };

    const slots = await slotService.listSlots(filters);

    return res.status(200).json(slots);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSlot,
  listSlots,
};
