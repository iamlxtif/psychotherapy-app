-- Migration 003: Scheduled sessions
CREATE TABLE IF NOT EXISTS appointments (
  id            SERIAL PRIMARY KEY,
  patient_id    INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER NOT NULL DEFAULT 50,
  status        VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);