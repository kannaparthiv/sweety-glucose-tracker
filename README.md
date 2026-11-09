# Sweety – Blood Glucose Tracker (MERN + PostgreSQL)

[![Tests](https://img.shields.io/badge/tests-29%20passed-brightgreen.svg)]()
[![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20React%20%7C%20TailwindCSS-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

**Sweety** is a responsive, clinical-grade blood glucose tracking application built for diabetes patients. Patients can log up to 4 daily blood glucose readings across designated time slots, monitor their target ranges, and view daily, month-to-date, and previous-month clinical summary reports.

Developed for the **Kenpath Junior Full Stack Developer – JavaScript & AI** technical assessment.

---

## Table of Contents

- [Features Overview](#features-overview)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Demo Credentials](#demo-credentials)
- [Prerequisites](#prerequisites)
- [Installation & Quick Start](#installation--quick-start)
  - [Option A: Zero-Config Local Setup (Recommended)](#option-a-zero-config-local-setup-recommended)
  - [Option B: Docker Compose (Full Stack + PostgreSQL)](#option-b-docker-compose-full-stack--postgresql)
  - [Option C: Native PostgreSQL Service](#option-c-native-postgresql-service)
- [Environment Configuration](#environment-configuration)
- [Database Migrations & Seeding](#database-migrations--seeding)
- [Running Automated Tests](#running-automated-tests)
- [API Reference](#api-reference)
- [Validation Rules Implemented](#validation-rules-implemented)
- [Reports Logic & Calculations](#reports-logic--calculations)
- [Notes & Architectural Assumptions](#notes--architectural-assumptions)
  - [Assumptions](#assumptions)
  - [What I would improve with more time](#what-i-would-improve-with-more-time)

---

## Features Overview

### 1. User Authentication & Isolation
- **Secure Registration & Login**: User registration with name, email, and password.
- **Bcrypt Hashing**: Passwords are encrypted with `bcrypt` (10 salt rounds); plain-text passwords are never stored.
- **JWT Authentication**: Stateless, signed JSON Web Tokens for session verification.
- **Strict Multi-tenant Row Isolation**: Every query filters by `user_id = req.user.id`. Patients can only view, modify, or delete their own glucose readings.

### 2. Blood Glucose Readings CRUD
- **Time Slots**: Exactly 4 daily slots:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Measurement Unit**: Glucose level in **mg/dl**.
- **Interactive Badges**: Real-time visual feedback (<70 Low, 70–140 Target/Normal, 141–199 Elevated, 200+ High).
- **Edit & Delete**: Full edit modal and confirmation delete workflow.

### 3. Comprehensive Clinical Reports
- **Daily Report**: Aggregates highest, lowest, average (rounded to 1 decimal), reading count, and lists every reading with its respective slot for the chosen date.
- **Month-to-Date Report**: Summarizes from the 1st of the month through the selected date.
- **Monthly Report (Previous Month)**: Computes full previous month statistics (e.g. 1 Sep – 30 Sep if selected date is 15 Oct).
- **Friendly Empty States**: Helpful illustrations and messages when no readings exist for the selected date or range.

### 4. Bonus Features Implemented
- [x] **Pagination on `GET /api/readings`**: Supported with `?page=1&limit=20` (and `totalPages`, `total`).
- [x] **Interactive Trend Charts**: Interactive Recharts line chart illustrating readings over the month with target normal range bands (70–140 mg/dl).
- [x] **Docker & Docker Compose**: Multi-container setup (`docker-compose.yml`) containing PostgreSQL 16 Alpine, Node.js Express API, and Nginx-served React frontend.
- [x] **Automated Frontend Tests**: Component testing with React Testing Library and Vitest covering form validation rules.
- [x] **Comprehensive Backend Tests**: Integration and unit tests with Jest and Supertest covering Auth, CRUD, isolation, and report mathematics (23 tests passing).
- [x] **Database Seed Script**: Pre-seeds 45+ days of realistic readings for instant demo and evaluation.

---

## Tech Stack & Architecture

- **Backend**: Node.js, Express.js, PostgreSQL (`pg` pool with PGlite zero-config fallback), JWT, BcryptJS
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, Recharts
- **Testing**: Jest, Supertest, Vitest, React Testing Library, JSDOM
- **DevOps**: Docker, Docker Compose, Nginx

```
sweety-glucose-tracker/
├── docker-compose.yml          # Multi-container Docker deployment
├── .env.example                # Sample environment variables
├── package.json                # Root orchestrator scripts
├── server/                     # Express.js REST API
│   ├── Dockerfile
│   ├── src/
│   │   ├── config/db.js        # PostgreSQL pool & PGlite fallback
│   │   ├── controllers/        # Auth, Readings, Reports controllers
│   │   ├── middleware/         # JWT Auth, error handling
│   │   ├── routes/             # REST endpoints
│   │   ├── scripts/            # Database migrate.js and seed.js
│   │   ├── utils/              # Date range calculators
│   │   ├── app.js              # Express app definition
│   │   └── server.js           # Server bootstrap
│   └── tests/                  # Jest + Supertest suites
└── client/                     # React + Vite Frontend
    ├── Dockerfile
    ├── nginx.conf
    ├── src/
    │   ├── api/client.js       # Fetch wrapper with JWT headers
    │   ├── components/         # Navbar, ReadingsList, ReportsView, Chart, Form
    │   ├── context/AuthContext # React Auth context
    │   ├── App.jsx             # Main dashboard & tabs
    │   └── tests/              # React Testing Library test suites
```

---

## Demo Credentials

The repository includes a seed script that creates a ready-to-test patient with 140+ readings over the past 45 days:

| Field | Value |
|---|---|
| **Email** | `demo@sweety.com` |
| **Password** | `Password123!` |
| **Patient Name** | Jane Doe |

*Note: The frontend login modal includes a **"Fill Demo"** button to populate these credentials in 1 click.*

---

## Prerequisites

- **Node.js**: v18.x, v20.x, or v22+
- **npm** or **yarn**
- *(Optional)* Docker & Docker Compose or local PostgreSQL instance

---

## Installation & Quick Start

Clone this repository:
```bash
git clone <your-repo-link>
cd sweety-glucose-tracker
```

### Option A: Zero-Config Local Setup (Recommended)
This runs the backend using the embedded WebAssembly PostgreSQL engine (`PGlite`), meaning **no external database or Docker setup is required**:

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Seed the database** (creates tables and loads demo patient data):
   ```bash
   npm run seed
   ```

3. **Start the backend server** (runs on port 5000):
   ```bash
   npm run dev:server
   ```

4. **Start the frontend application** (in another terminal, runs on port 3000):
   ```bash
   npm run dev:client
   ```

5. Open your browser at **`http://localhost:3000`**.

---

### Option B: Docker Compose (Full Stack + PostgreSQL)
To run the entire system (PostgreSQL 16, Express API, React Client) inside Docker containers:

1. Build and start containers:
   ```bash
   docker-compose up --build
   ```

2. Access the application:
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000/api/health`

3. To seed demo data into the running Docker container:
   ```bash
   docker-compose exec server node src/scripts/seed.js
   ```

4. To stop containers:
   ```bash
   docker-compose down
   ```

---

### Option C: Native PostgreSQL Service
If you have a local PostgreSQL daemon running:

1. Create a database:
   ```sql
   CREATE DATABASE sweety_db;
   ```

2. Set your connection string in `server/.env`:
   ```env
   USE_PGLITE=false
   DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/sweety_db
   ```

3. Run migrations and seed:
   ```bash
   npm run migrate
   npm run seed
   ```

4. Start servers:
   ```bash
   npm run dev:server
   npm run dev:client
   ```

---

## Environment Configuration

Check `.env.example` in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=sweety_jwt_secret_dev_key_2026
JWT_EXPIRES_IN=7d

# PostgreSQL Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sweety_db
PGUSER=postgres
PGPASSWORD=postgres
PGHOST=localhost
PGPORT=5432
PGDATABASE=sweety_db

# Zero-config embedded PostgreSQL (set true for instant evaluation without PostgreSQL daemon)
USE_PGLITE=true
PGLITE_DATA_DIR=./data/pglite

# Frontend API Target
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Running Automated Tests

Both backend and frontend have dedicated test suites:

### 1. Run all tests:
```bash
npm test
```

### 2. Backend tests only (Jest + Supertest):
```bash
npm run test:server
```
*Tests authentication, validation rules, duplicate slot prevention, max 4 readings/day check, future date prevention, user data isolation, pagination, and reporting calculations.*

### 3. Frontend tests only (Vitest + React Testing Library):
```bash
npm run test:client
```
*Tests the reading form rendering, required field validations, range boundary checks (40–600 mg/dl), future date rejection, and successful submissions.*

---

## Validation Rules Implemented

| Rule | Trigger | User-Facing Error Message |
|---|---|---|
| **Value is required** | Empty or non-numeric value | `"Please enter a glucose value."` |
| **Value in range** | `< 40` or `> 600` or non-integer | `"Value must be between 40 and 600 mg/dl."` |
| **Slot uniqueness** | Duplicate slot for same patient on same date | `"You already have an After lunch reading for this date."` |
| **Daily limit** | Attempting 5th reading on same date | `"You can add only 4 readings per day."` |
| **No future date** | Date string is after today's date | `"Date cannot be in the future."` |

---

## Reports Logic & Calculations

When an anchor date (e.g., `2026-10-15`) is selected:

1. **Daily Report**:
   - **Range**: `2026-10-15` to `2026-10-15`
   - **Metrics**: Highest reading, lowest reading, average reading (rounded to 1 decimal place: `Math.round(avg * 10) / 10`), count of readings.
   - **Listing**: Lists each individual reading recorded that day with its slot and clinical status badge.

2. **Month-to-Date Report**:
   - **Range**: `2026-10-01` to `2026-10-15` (1st of current month up to the selected anchor date).
   - **Metrics**: Highest, lowest, average (rounded to 1 decimal), total readings.

3. **Monthly Report (Previous Month)**:
   - **Range**: Full previous month, e.g. `2026-09-01` to `2026-09-30`.
   - Handles year-boundary wrap-around (e.g. if selected date is in January 2027, previous month is December 2026).
   - **Metrics**: Highest, lowest, average (rounded to 1 decimal), total readings.

4. **Empty State**:
   - If `count === 0`, displays friendly empty card with a prompt to record readings for that period.

---

## Notes & Architectural Assumptions

### Assumptions
1. **Timezone & Future Date Validation**: Dates are stored in `DATE` format (`YYYY-MM-DD`). A reading is deemed "future" if its `YYYY-MM-DD` exceeds the current date in the user's local timezone.
2. **Daily Reading Limit**: The 4 readings per day maximum naturally aligns with the 4 slots (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`). The API validates both:
   - Slot uniqueness is verified first, providing the specific slot conflict message (e.g. `"You already have an After lunch reading for this date."`).
   - The total daily count is capped at 4.
3. **Database Flexibility**: To make reviewing effortless across diverse operating systems without forcing evaluators to run or configure local PostgreSQL services, the database layer supports both real PostgreSQL (via `pg.Pool` or Docker) and embedded PostgreSQL (`PGlite` WASM) toggled by `USE_PGLITE=true`. Both execute identical PostgreSQL queries and constraints.

### What I would improve with more time
1. **Doctor / Clinician Role**:
   - Introduce a `role` enum (`patient` vs `doctor`) on the `users` table.
   - Create a `doctor_patient_assignments` table allowing doctors to view read-only reports and trend graphs of their assigned patients.
2. **Redis Report Caching**:
   - Cache expensive aggregations on `GET /api/reports?date=...` in Redis with cache invalidation triggered whenever a reading for that user is added, updated, or deleted.
3. **Background Reminder Jobs (BullMQ)**:
   - Schedule a daily job at 8:00 PM that scans active patients; if a patient has fewer than 4 readings logged for the day, send an email or push notification reminder.
4. **Data Export**:
   - Add a one-click **"Export PDF / CSV"** button so patients can print their 30-day glycemic report for clinical checkups.
5. **Offline Support (PWA)**:
   - Implement service workers and IndexedDB sync so patients without stable network connectivity can log readings offline and sync when reconnected.

---

## Submission Checklist

- [x] Working full stack application (Node.js + Express + PostgreSQL + React)
- [x] Sign up and login with bcrypt password hashing & JWT
- [x] Multi-tenant user isolation (users only see their own readings)
- [x] Add, view, edit, and delete readings
- [x] All 5 required validation rules with exact error messages
- [x] Daily report with individual slot list, Month-to-date report, and Previous Month report
- [x] Highest, lowest, average (rounded to 1 decimal), and count metrics
- [x] Friendly empty states when no readings exist
- [x] Bonus: Pagination (`GET /api/readings?page=1&limit=20`)
- [x] Bonus: Recharts line chart with target glycemic range
- [x] Bonus: Docker Compose (`docker-compose.yml`)
- [x] Bonus: Frontend React Testing Library tests
- [x] Automated backend tests with Supertest (23 tests passing)
- [x] Seed script with demo credentials (`npm run seed`)
- [x] Clean `.env.example`
- [x] "Notes" section with assumptions and future improvements
- [x] Clean atomic git commits
