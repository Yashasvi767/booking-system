# Booking System Backend

## Overview
This project implements a **concurrency-safe booking system backend** inspired by real-world platforms such as RedBus, BookMyShow, and doctor appointment scheduling systems.  
The primary focus is on **correctness under high concurrency**, **clean system architecture**, and **production-ready backend design** using Node.js, Express, and PostgreSQL.

The system guarantees that **overbooking cannot occur**, booking states remain consistent, and all critical operations are handled atomically at the database level.

---

## Features

- Admin-managed slot/show creation
- User-facing slot discovery (future slots with available capacity)
- Transactional booking creation with strong concurrency guarantees
- Booking lifecycle states: `PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED`
- Lazy expiry of stale pending bookings
- Cancellation with automatic seat restoration
- Centralized error handling and consistent API responses
- Designed with scalability and production deployment in mind
- Concurrency-tested using parallel request scripts

---

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/booking-system.git
cd booking-system
```

---

### 2. Install Dependencies
```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root (this file should **never be committed**):

```env
PORT=3000

PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=booking_system
PGPORT=5432

NODE_ENV=development
```

A reference file `.env.example` is included in the repository to document required variables.

---

### 4. Database Setup

Ensure PostgreSQL is running locally or remotely.

Create the database:
```sql
CREATE DATABASE booking_system;
```

Create required tables:
```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_name TEXT NOT NULL,
  specialization TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT,
  total_capacity INT NOT NULL,
  remaining_capacity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  num_seats INT NOT NULL,
  status TEXT CHECK (status IN ('PENDING','CONFIRMED','FAILED','CANCELLED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. Start the Application
```bash
npm run dev
```

The server will start at:
```
http://localhost:3000
```

Health check:
```bash
curl http://localhost:3000/health
```

---

## API Overview

### Admin Endpoints
- `POST /api/admin/slots` — Create a new slot
- `GET /api/admin/slots` — List all slots
- `POST /api/admin/expire-pending` — Expire stale pending bookings

### User Endpoints
- `GET /api/slots` — List available future slots

### Booking Endpoints
- `POST /api/bookings` — Create a booking (transactional)
- `GET /api/bookings/:id` — Retrieve booking (lazy expiry applied)
- `POST /api/bookings/:id/cancel` — Cancel a confirmed booking

A complete Postman collection is available at:
```
docs/postman_collection.json
```

---

## Project Structure

```text
booking-system/
│
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic & transactions
│   ├── repositories/   # Database queries
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Error handling & response wrappers
│   ├── utils/           # Shared helpers
│   ├── jobs/            # Background / expiry jobs
│   ├── app.js           # Express app configuration
│   └── server.js        # Server entry point
│
├── scripts/
│   └── concurrentBookingsTest.js
│
├── docs/
│   ├── SYSTEM_DESIGN.md
│   └── postman_collection.json
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## Concurrency & Data Consistency

- All booking operations run inside **PostgreSQL transactions**.
- Seat reservation uses a **single atomic SQL update**:
  ```sql
  UPDATE slots
  SET remaining_capacity = remaining_capacity - $numSeats
  WHERE id = $slotId AND remaining_capacity >= $numSeats
  RETURNING *;
  ```
- This guarantees that two concurrent bookings cannot overbook the same slot.
- Row-level locks (`SELECT ... FOR UPDATE`) are used for lazy expiry and cancellation flows.

---

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- node-postgres (pg)
- nodemon
- Postman
- Mermaid (for architecture diagrams)

---

## Testing

- Manual API testing via Postman
- Concurrency testing using parallel request scripts
- Database-level verification of capacity constraints
- Tested scenarios:
  - Full-capacity booking
  - Overbooking attempts
  - Booking expiry
  - Cancellation and seat restoration

---

## System Design

A complete system design document is available at:
```
docs/SYSTEM_DESIGN.md
```

It includes architecture diagrams, ER diagrams, booking flows, concurrency guarantees, and scaling considerations.

---

## Notes

- `node_modules` and `.env` are intentionally excluded from version control.
- The system is designed to be deployed on platforms such as Railway or Render.
- The primary focus of this project is **backend correctness and scalability**, not UI.

---

## Author
<Your Name>
