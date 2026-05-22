import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

// ─────────────────────────────────────────────
// GET /api/appointments
// Admin + receptionist: all appointments
// Therapist: only their own
// ─────────────────────────────────────────────
export const getAppointments = async (req, res) => {
  const isTherapist = req.user.role === 'therapist'

  const { rows } = await query(
    `SELECT
       a.id, a.scheduled_at, a.duration_mins, a.status,
       a.created_at,
       p.first_name || ' ' || p.last_name AS patient_name,
       u.name AS therapist_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u ON u.id = a.therapist_id
     WHERE ($1 = false OR a.therapist_id = $2)
     ORDER BY a.scheduled_at DESC`,
    [isTherapist, req.user.userId]
  )

  res.json(rows)
}

// ─────────────────────────────────────────────
// GET /api/appointments/:id
// Admin + receptionist: any appointment
// Therapist: only their own (404 if not theirs)
// ─────────────────────────────────────────────
export const getAppointmentById = async (req, res) => {
  const { rows } = await query(
    `SELECT
       a.*,
       p.first_name || ' ' || p.last_name AS patient_name,
       u.name AS therapist_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u ON u.id = a.therapist_id
     WHERE a.id = $1`,
    [req.params.id]
  )

  const appointment = rows[0]

  if (!appointment) {
    throw new AppError('Appointment not found', 404)
  }

  // Therapist ownership check
  if (req.user.role === 'therapist' && appointment.therapist_id !== req.user.userId) {
    throw new AppError('Appointment not found', 404)
  }

  res.json(appointment)
}

// ─────────────────────────────────────────────
// POST /api/appointments
// Admin or receptionist creates appointments
// ─────────────────────────────────────────────
export const createAppointment = async (req, res) => {
  const { patient_id, therapist_id, scheduled_at, duration_mins } = req.body

  if (!patient_id || !therapist_id || !scheduled_at) {
    throw new AppError('patient_id, therapist_id, and scheduled_at are required', 400)
  }

  // Verify patient exists and is active
  const { rows: patient } = await query(
    'SELECT id, therapist_id FROM patients WHERE id = $1 AND is_active = true',
    [patient_id]
  )
  if (!patient[0]) {
    throw new AppError('Patient not found', 404)
  }

  // Verify the appointment is for the patient's assigned therapist
  if (patient[0].therapist_id !== therapist_id) {
    throw new AppError('Therapist is not assigned to this patient', 400)
  }

  // Verify therapist exists and is active
  const { rows: therapist } = await query(
    `SELECT id FROM users WHERE id = $1 AND role = 'therapist' AND is_active = true`,
    [therapist_id]
  )
  if (!therapist[0]) {
    throw new AppError('Therapist not found', 404)
  }

  const { rows } = await query(
    `INSERT INTO appointments (patient_id, therapist_id, scheduled_at, duration_mins, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [patient_id, therapist_id, scheduled_at, duration_mins || 50, req.user.userId]
  )

  res.status(201).json(rows[0])
}

// ─────────────────────────────────────────────
// PUT /api/appointments/:id
// Admin or receptionist updates appointments
// ─────────────────────────────────────────────
export const updateAppointment = async (req, res) => {
  const { scheduled_at, duration_mins, status } = req.body

  const { rows: existing } = await query(
    'SELECT * FROM appointments WHERE id = $1',
    [req.params.id]
  )

  if (!existing[0]) {
    throw new AppError('Appointment not found', 404)
  }

  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show']
  if (status && !validStatuses.includes(status)) {
    throw new AppError(`status must be one of: ${validStatuses.join(', ')}`, 400)
  }

  const { rows } = await query(
    `UPDATE appointments SET
       scheduled_at  = COALESCE($1, scheduled_at),
       duration_mins = COALESCE($2, duration_mins),
       status        = COALESCE($3, status),
       updated_at    = NOW()
     WHERE id = $4
     RETURNING *`,
    [scheduled_at, duration_mins, status, req.params.id]
  )

  res.json(rows[0])
}

// ─────────────────────────────────────────────
// DELETE /api/appointments/:id
// Admin or receptionist — sets status to cancelled
// ─────────────────────────────────────────────
export const cancelAppointment = async (req, res) => {
  const { rows } = await query(
    'SELECT id, status FROM appointments WHERE id = $1',
    [req.params.id]
  )

  if (!rows[0]) {
    throw new AppError('Appointment not found', 404)
  }

  if (rows[0].status === 'completed') {
    throw new AppError('Cannot cancel a completed appointment', 400)
  }

  await query(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [req.params.id]
  )

  res.status(204).send()
}