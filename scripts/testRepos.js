// scripts/testRepos.js
require("dotenv").config();
const { pool } = require("../src/config/db");
const slotRepo = require("../src/repositories/slotRepository");
const bookingRepo = require("../src/repositories/bookingRepository");

async function main() {
  try {
    // 1. Create a slot
    const slot = await slotRepo.createSlot({
      doctor_name: "Dr. Test",
      specialization: "General",
      start_time: new Date().toISOString(),
      duration_minutes: 30,
      total_capacity: 5,
    });

    console.log("Created slot:", slot);

    // 2. Create a PENDING booking
    const booking = await bookingRepo.createBooking({
      slot_id: slot.id,
      user_id: "user123",
      num_seats: 1,
      status: "PENDING",
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // +2 minutes
    });

    console.log("Created booking:", booking);

    // 3. Decrement capacity
    const updatedSlot = await slotRepo.decrementRemainingCapacity(
      slot.id,
      1
    );
    console.log("Updated slot after capacity decrement:", updatedSlot);

    // 4. Confirm booking
    const confirmedBooking = await bookingRepo.updateBookingStatus(
      booking.id,
      "CONFIRMED"
    );
    console.log("Confirmed booking:", confirmedBooking);
  } catch (err) {
    console.error("Error in test:", err);
  } finally {
    await pool.end();
  }
}

main();
