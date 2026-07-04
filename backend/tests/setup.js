import pg from 'pg'
import bcrypt from 'bcrypt'

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:taekwondoCRM9889@localhost:5432/psychotherapy_test'
})

export const resetDatabase = async () => {
  await pool.query(`
    TRUNCATE TABLE
      audit_events, sessions, appointments, patients, users
    RESTART IDENTITY CASCADE
  `)

  const adminHash = await bcrypt.hash('admin123', 10)
  const therapistHash = await bcrypt.hash('therapist123', 10)
  const therapist2Hash = await bcrypt.hash('therapist123', 10)
  const receptionistHash = await bcrypt.hash('reception123', 10)

  const result = await pool.query(`
    INSERT INTO users (email, password_hash, name, role) VALUES
      ('admin@clinic.com',      $1, 'Test Admin',          'admin'),
      ('therapist@clinic.com',  $2, 'Dr. Test Therapist',  'therapist'),
      ('therapist2@clinic.com', $3, 'Dr. Test Therapist2', 'therapist'),
      ('reception@clinic.com',  $4, 'Test Receptionist',   'receptionist')
    RETURNING id, email
  `, [adminHash, therapistHash, therapist2Hash, receptionistHash])

}
export const closePool = async () => {
  await pool.end()
}

export { pool }