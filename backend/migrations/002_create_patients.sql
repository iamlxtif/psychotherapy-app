-- Migration 002: Patients assigned to therapists
CREATE TABLE IF NOT EXISTS patients (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(255) NOT NULL,
  last_name     VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  address       TEXT,
  therapist_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);