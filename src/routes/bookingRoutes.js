// src/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Create booking (basic, no concurrency handling yet)
router.post("/bookings", bookingController.createBooking);

// Optional: get booking by id (simple read)
router.get("/bookings/:id", bookingController.getBookingById);

router.post("/bookings/:id/cancel",bookingController.cancelBooking);
module.exports = router;
