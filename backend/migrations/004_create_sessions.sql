-- Migration 004: Clinical notes for completed appointments
CREATE TABLE IF NOT EXISTS sessions (
  id              SERIAL PRIMARY KEY,
  appointment_id  INTEGER NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes           TEXT NOT NULL,
  mood_rating     INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);