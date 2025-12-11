# Booking System (Mini) — Backend

A small ticket/appointment booking backend demonstrating:
- Node.js + Express
- PostgreSQL (atomic capacity decrement)
- Transactional booking creation (no overbooking)
- Lazy expiry of PENDING bookings
- Cancellation with capacity restoration
- Concurrency testing script

---

## Quick links
- Postman collection: `docs/postman_collection.json`
- Concurrency test script: `scripts/concurrentBookingsTest.js`

---

## Tech stack
- Node.js (v18+ recommended)
- Express.js
- PostgreSQL (TIMESTAMPTZ)
- pg (node-postgres)
- nodemon (dev)
- node-cron (optional)
- winston (optional logging)

---

## Setup (local)

1. Clone repo:
```bash
git clone <repo-url>
cd booking-system
