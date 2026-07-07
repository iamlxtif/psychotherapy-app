# Psychotherapy Center App

A full-stack web application for managing patients, therapists, appointments, and clinical session notes. Built as a real client project for a psychotherapy center.

**GitHub:** https://github.com/iamlxtif/psychotherapy-app **API Docs:** http://localhost:3001/api/docs *(Swagger UI — run locally)*

> AWS deployment with EC2, RDS, Nginx, and HTTPS will be added in a future iteration (Week 9 of the DevOps roadmap).

---

## Stack

**Backend:** Node.js 20 · Express.js · PostgreSQL · JWT · bcrypt **Testing:** Vitest · Supertest · 27 integration tests **Documentation:** Swagger UI (OpenAPI 3.0) **Frontend:** React · Vite · Tailwind CSS *(in progress)*

---

## Project Structure

```
psychotherapy-app/
├── backend/
│   ├── migrations/         ← SQL migration files (run in order)
│   ├── scripts/
│   │   ├── migrate.js      ← idempotent migration runner
│   │   └── seed.js         ← creates first admin account
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js       ← PostgreSQL connection pool
│   │   │   ├── env.js      ← fail-fast env validation
│   │   │   └── swagger.js  ← OpenAPI spec config
│   │   ├── controllers/    ← auth, users, patients, appointments, sessions, audit
│   │   ├── middleware/
│   │   │   ├── auth.js         ← JWT verification (authenticate)
│   │   │   ├── authorize.js    ← role-based access (authorize factory)
│   │   │   ├── errorHandler.js ← global error handler
│   │   │   └── notFound.js     ← 404 handler
│   │   ├── routes/
│   │   └── utils/
│   │       ├── AppError.js     ← operational error class
│   │       ├── asyncHandler.js ← async error forwarding
│   │       └── audit.js        ← createAuditEvent helper
│   └── tests/
│       ├── setup.js            ← test DB reset and seed
│       ├── helpers.js          ← getTokens, createTestPatient, etc.
│       ├── auth.test.js
│       ├── ownership.test.js
│       ├── roles.test.js
│       └── business-rules.test.js
└── frontend/               ← React + Vite + Tailwind CSS (in progress)
```

---

## Database Schema

```
users
  id, email, password_hash, name, role, is_active, created_at, updated_at

patients
  id, first_name, last_name, date_of_birth, phone, email, address,
  therapist_id → users (RESTRICT), notes, is_active, created_at, updated_at

appointments
  id, patient_id → patients (CASCADE), therapist_id → users (RESTRICT),
  scheduled_at, duration_mins, status, created_by → users, created_at, updated_at

sessions
  id, appointment_id → appointments UNIQUE (CASCADE), patient_id → patients,
  therapist_id → users (RESTRICT), notes, mood_rating (1–10), created_at, updated_at

audit_events
  id, user_id → users (SET NULL), action, entity, entity_id, payload (JSONB), created_at
```

---

## Roles & Access Control


| Resource       | Admin              | Therapist            | Receptionist       |
| -------------- | ------------------ | -------------------- | ------------------ |
| Staff accounts | ✅ Full CRUD       | ❌                   | ❌                 |
| Patients       | ✅ All patients    | ✅ Own patients only | ❌                 |
| Appointments   | ✅ All             | ✅ Own (read only)   | ✅ All (full CRUD) |
| Session notes  | ✅ All (read/edit) | ✅ Own (write/edit)  | ❌                 |
| Audit log      | ✅                 | ❌                   | ❌                 |

### Ownership Isolation

Ownership is enforced at the **query level** using a boolean SQL filter:

```sql
WHERE ($1 OR therapist_id = $2)
-- $1 = isAdmin (true → all rows, false → own rows only)
```

A therapist's token returns **404** (not 403) for any patient that isn't theirs — preventing information leakage about other therapists' caseloads.

---

## Key Design Decisions

**No public registration.** This is a staff-only internal tool. Admin provisions all accounts. Exposing a public registration endpoint on a system handling clinical data would be a security vulnerability.

**Same error for wrong email and wrong password.** Both return `401 { "error": "Invalid email or password" }` — prevents user enumeration attacks where an attacker probes which emails exist in the system.

**Soft deletes on patients and staff.**`is_active = false` hides records from normal queries while preserving all historical data — appointments, sessions, and audit trail. Healthcare systems cannot hard-delete patient records.

**Append-only audit log.** Every create, update, and delete on patient records writes to `audit_events` with a JSONB `{ before, after }` payload. Audit records are never modified — they are evidence. `ON DELETE SET NULL` on `user_id` means a deleted staff member's audit trail is preserved.

**UNIQUE constraint on `sessions.appointment_id`.** One session per appointment is enforced at the database level, not just application code — prevents duplicate clinical notes even in race conditions.

**`ON DELETE RESTRICT` on `patients.therapist_id`.** A therapist with active patients cannot be deleted — prevents orphaned patient records. Admin must reassign patients first.

---

## Getting Started

### Prerequisites

* Node.js 20+
* PostgreSQL

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/psychotherapy
JWT_SECRET=your_secret_here
```

Run migrations and seed the first admin:

```bash
npm run migrate
npm run seed
```

Start the server:

```bash
npm run dev
```

* API: `http://localhost:3001`
* Swagger docs: `http://localhost:3001/api/docs`

Default admin credentials (change after first login):

```
Email:    admin@clinic.com
Password: admin123
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`*(in progress)*

---

## Running Tests

```bash
cd backend

# Create test database (first time only)
psql -U postgres -c "CREATE DATABASE psychotherapy_test;"
npm run migrate  # with DATABASE_URL pointing at psychotherapy_test

npm test
```

**27 integration tests across 4 files:**


| File                     | What it proves                                      |
| ------------------------ | --------------------------------------------------- |
| `auth.test.js`           | Login, token validation, deactivated accounts       |
| `ownership.test.js`      | Therapist A cannot access Therapist B's data        |
| `roles.test.js`          | Role restrictions enforced at every route           |
| `business-rules.test.js` | Duplicate sessions, status transitions, audit trail |

The ownership isolation tests are the most critical — they verify that a therapist's token returns 404 (not 403) for another therapist's patients, proving data cannot leak between caseloads.

---

## API Reference

Full interactive documentation at `http://localhost:3001/api/docs` (Swagger UI).


| Method | Path                     | Auth                  | Description                           |
| ------ | ------------------------ | --------------------- | ------------------------------------- |
| POST   | `/api/auth/login`        | Public                | Login, receive JWT                    |
| GET    | `/api/auth/me`           | 🔒 Any                | Current user profile                  |
| GET    | `/api/users`             | 🔒 Admin              | List staff accounts                   |
| POST   | `/api/users`             | 🔒 Admin              | Create staff account                  |
| GET    | `/api/users/:id`         | 🔒 Admin              | Get one staff member                  |
| PUT    | `/api/users/:id`         | 🔒 Admin              | Update staff (name, role, is\_active) |
| GET    | `/api/patients`          | 🔒 Admin/Therapist    | List patients                         |
| POST   | `/api/patients`          | 🔒 Admin/Therapist    | Create patient                        |
| GET    | `/api/patients/:id`      | 🔒 Admin/Therapist    | Get patient                           |
| PUT    | `/api/patients/:id`      | 🔒 Admin/Therapist    | Update patient                        |
| DELETE | `/api/patients/:id`      | 🔒 Admin              | Deactivate patient                    |
| GET    | `/api/appointments`      | 🔒 All roles          | List appointments                     |
| POST   | `/api/appointments`      | 🔒 Admin/Receptionist | Create appointment                    |
| GET    | `/api/appointments/:id`  | 🔒 All roles          | Get appointment                       |
| PUT    | `/api/appointments/:id`  | 🔒 Admin/Receptionist | Update appointment                    |
| DELETE | `/api/appointments/:id`  | 🔒 Admin/Receptionist | Cancel appointment                    |
| GET    | `/api/sessions`          | 🔒 Admin/Therapist    | List sessions                         |
| POST   | `/api/sessions`          | 🔒 Therapist          | Write session notes                   |
| GET    | `/api/sessions/:id`      | 🔒 Admin/Therapist    | Get session                           |
| PUT    | `/api/sessions/:id`      | 🔒 Admin/Therapist    | Update session notes                  |
| GET    | `/api/audit`             | 🔒 Admin              | List audit events                     |
| GET    | `/api/audit/patient/:id` | 🔒 Admin              | Patient audit trail                   |

---

## Environment Variables


| Variable       | Required | Description                          |
| -------------- | -------- | ------------------------------------ |
| `PORT`         | Yes      | Server port (3001)                   |
| `NODE_ENV`     | Yes      | `development`,`test`, or`production` |
| `DATABASE_URL` | Yes      | PostgreSQL connection string         |
| `JWT_SECRET`   | Yes      | Secret for signing JWT tokens        |

Never commit `.env` files. In production, set variables directly in your hosting dashboard.

---

## Notable Bugs Fixed During Development

**`getTokens()` returning `undefined`** — Used JS comma operator in return statement (`return a, b, c, d` returns only the last value). Fixed by returning an object: `return { admin, therapist, therapist2, receptionist }`.

**Test files running against wrong database** — `dotenv.config()` does not override existing `process.env` variables by default. Fixed with `override: true` so `.env.test` always wins in test context.

**Vitest parallel file execution causing race conditions** — All 4 test files ran simultaneously and called `resetDatabase()` concurrently, causing duplicate key violations. Fixed with `fileParallelism: false` in `vitest.config.js`.
