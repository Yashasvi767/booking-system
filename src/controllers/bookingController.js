// src/controllers/bookingController.js
const bookingService = require("../services/bookingService");
const { success, failure } = require("../utils/response");

// POST /api/bookings
async function createBooking(req, res, next) {
  try {
    const { slot_id, user_id, num_seats } = req.body;

    // Basic validation
    const errors = [];
    if (!slot_id || typeof slot_id !== "string") errors.push("slot_id is required (uuid string).");
    if (!user_id || typeof user_id !== "string") errors.push("user_id is required (string).");
    if (num_seats === undefined || !Number.isInteger(num_seats) || num_seats <= 0) {
      errors.push("num_seats is required and must be a positive integer.");
    }

    if (errors.length) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: errors });
    }

    const booking = await bookingService.createBooking({
      slot_id,
      user_id,
      num_seats,
    });

    return res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/:id
async function getBookingById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      return res.notFound("Booking not found");
    }
    return res.success(booking);
  } catch (err) {
    next(err);
  }
}

// POST /api/bookings/:id/cancel  (or DELETE)
async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    // Optional: check auth -> whether user can cancel (not covered here)
    const result = await bookingService.cancelBooking(id);
    return res.status(200).json({
      message: "Booking cancelled",
      booking: result.booking,
      slot: result.slot,
    });
  } catch (err) {
    next(err);
  }
}


module.exports = {
  createBooking,
  getBookingById,
  cancelBooking
};
