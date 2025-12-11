// scripts/concurrentBookingsTest.js
// Node script to fire N concurrent booking requests to your running local server.
// Usage: node scripts/concurrentBookingsTest.js <slotId> <concurrentRequests> <numSeatsEach>
// Example: node scripts/concurrentBookingsTest.js 1d5667b9-c9a5-4d3d-b669-a68c4d66aa23 10 1

const http = require("http");

const [,, slotId, concurrent = "10", numSeats = "1"] = process.argv;

if (!slotId) {
  console.error("Usage: node scripts/concurrentBookingsTest.js <slotId> <concurrentRequests> <numSeatsEach>");
  process.exit(1);
}

const CONCURRENT = parseInt(concurrent, 10);
const NUM_SEATS = parseInt(numSeats, 10);

function makeBooking(slot_id, userSuffix=0) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      slot_id,
      user_id: `testuser_${Date.now()}_${Math.floor(Math.random()*10000)}_${userSuffix}`,
      num_seats: NUM_SEATS
    });

    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/bookings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on("error", (e) => {
      resolve({ error: e.message });
    });

    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log(`Firing ${CONCURRENT} concurrent bookings for slot ${slotId} with ${NUM_SEATS} seat(s) each...`);
  const promises = [];
  for (let i = 0; i < CONCURRENT; i++) {
    promises.push(makeBooking(slotId, i));
  }
  const results = await Promise.all(promises);
  console.log("Results:");
  results.forEach((r, i) => {
    console.log(i+1, r.statusCode || "ERR", r.error ? r.error : r.body);
  });
})();
