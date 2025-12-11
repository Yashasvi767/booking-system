// src/services/bookingService.js
const bookingRepository = require("../repositories/bookingRepository");
const slotRepository = require("../repositories/slotRepository");
const { withTransaction } = require("../config/db");

/**
 * Transactional booking creation (atomic reservation).
 *
 * Flow (single DB transaction):
 * 1. Verify slot exists (select).
 * 2. Insert booking row with status = 'PENDING' and expires_at = now + 2min.
 * 3. Try to atomically decrement slots.remaining_capacity:
 *      UPDATE slots
 *      SET remaining_capacity = remaining_capacity - $1, updated_at = NOW()
 *      WHERE id = $2 AND remaining_capacity >= $1
 *      RETURNING ...
 * 4a. If UPDATE returned row -> mark booking CONFIRMED
 * 4b. If UPDATE returned no rows -> mark booking FAILED
 *
 * Using single transaction (client) ensures no race / no overbooking.
 */
async function createBooking({ slot_id, user_id, num_seats }) {
  // Basic caller-side validation (controller should already validate)
  if (!slot_id || !user_id || !Number.isInteger(num_seats) || num_seats <= 0) {
    const err = new Error("Invalid booking input");
    err.statusCode = 400;
    throw err;
  }

  return await withTransaction(async (client) => {
    // 1) Ensure slot exists (using the transaction client)
    const slot = await slotRepository.getSlotById(slot_id, client);
    if (!slot) {
      const err = new Error("Slot not found");
      err.statusCode = 404;
      throw err;
    }

    // 2) Create booking row in PENDING
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // +2 minutes
    const booking = await bookingRepository.createBooking(
      {
        slot_id,
        user_id,
        num_seats,
        status: "PENDING",
        expires_at: expiresAt,
      },
      client
    );

    // 3) Try to atomically decrement remaining_capacity
    const updatedSlot = await slotRepository.decrementRemainingCapacity(
      slot_id,
      num_seats,
      client
    );

    // 4) Depending on result, set booking status
    if (!updatedSlot) {
      // Not enough capacity -> mark booking FAILED
      const failed = await bookingRepository.updateBookingStatus(
        booking.id,
        "FAILED",
        client
      );
      // Return the booking (failed)
      return failed;
    } else {
      // Success -> mark booking CONFIRMED
      const confirmed = await bookingRepository.updateBookingStatus(
        booking.id,
        "CONFIRMED",
        client
      );
      return confirmed;
    }
  });
}

/**
 * Read booking by id (no transaction needed)
 */
async function getBookingById(bookingId) {
   if (!bookingId) {
    const e = new Error("bookingId required");
    e.statusCode = 400;
    throw e;
   }
}


async function expirePending() {
  return await bookingRepository.expirePendingBookings();
}

async function cancelBooking(bookingId, opts = {}) {
  if (!bookingId) {
    const err = new Error("bookingId required");
    err.statusCode = 400;
    throw err;
  }

  return await withTransaction(async (client) => {
    // 1) Get booking (in transaction)
    const booking = await bookingRepository.getBookingByIdForUpdate(bookingId, client);
     if (!booking) return null;

    // If pending and expired, mark FAILED and return the updated row
    if (booking.status === "PENDING") {
      const expiresAt = booking.expires_at ? new Date(booking.expires_at) : null;
      if (expiresAt && expiresAt.getTime() < Date.now()) {
        const failedBooking = await bookingRepository.updateBookingStatus(bookingId, "FAILED", client);
        return failedBooking;
    }
  }
    // 2) Only CONFIRMED bookings release seats back
    if (booking.status !== "CONFIRMED") {
      const err = new Error(`Only CONFIRMED bookings can be cancelled. Current status: ${booking.status}`);
      err.statusCode = 400;
      throw err;
    }

    const numSeats = booking.num_seats;
    const slotId = booking.slot_id;

    // 3) Atomically increment remaining_capacity (safety check: not exceed total_capacity)
    const updatedSlot = await slotRepository.incrementRemainingCapacity(slotId, numSeats, client);
    if (!updatedSlot) {
      // Something very unexpected — cannot add seats because it would exceed total_capacity
      const err = new Error("Cannot release seats — capacity constraints would be violated. Contact support.");
      err.statusCode = 500;
      throw err;
    }

    // 4) Update booking status to CANCELLED
    const cancelledBooking = await bookingRepository.updateBookingStatus(bookingId, "CANCELLED", client);

    // 5) (Optional) record cancellation metadata (who cancelled) - could add another table or column, skip for now
    
    if (booking.status === "PENDING") {
      const expiresAt = booking.expires_at ? new Date(booking.expires_at) : null;
      const now = new Date();
      if (expiresAt && expiresAt.getTime() < now.getTime()) {
        const failedBooking = await bookingRepository.updateBookingStatus(bookingId, "FAILED", client);
        return failedBooking;
      }
    }
    return {
      booking: cancelledBooking,
      slot: updatedSlot,
    };
  });
}

module.exports = {
  createBooking,
  getBookingById,
  expirePending,
  cancelBooking
};

