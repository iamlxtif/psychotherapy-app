import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { createAuditEvent } from '../utils/audit.js'

export const getPatients = async (req, res) => {
    const isAdmin = req.user.role === 'admin'

    const { rows } = await query(
        `select 
            p.id, p.first_name, p.last_name, p.date_of_birth,
            p.phone, p.email, p.is_active, p.created_at,
            u.name AS therapist_name
        FROM patients p
        JOIN users u ON u.id = p.therapist_id
        where ($1 or p.therapist_id = $2)
        and p.is_active = true
        order by p.created_at desc`,
        [isAdmin, req.user.userId]
    )

    res.json(rows)
}

export const getPatientById = async (req, res) => {
    const { rows } = await query(
        `select p.*, u.name as therapist_name
        from users u join patients p on u.id = p.therapist_id
        where p.is_active = true
        and p.id = $1`,
        [req.params.id]
    )

    const patient = rows[0]

    if (!patient) {
        throw new AppError('Patient not found', 404)
    }

    if (req.user.role === 'therapist' && patient.therapist_id !== req.user.userId){
        throw new AppError('Patient not found', 404)
    }

    res.json(patient)
}

export const createPatient = async (req, res) => {
    const { first_name, last_name, date_of_birth, phone, email, address, therapist_id, notes } = req.body

    if (!first_name || !last_name) {
        throw new AppError('first_name and last_name are required', 400)
    }

    const assignedTherapistId = req.user.role === 'therapist' ? req.user.userId : therapist_id

    if (!assignedTherapistId) {
        throw new AppError('therapist_id is required', 400)
    }

    const { rows: therapist } = await query(
        `select id from users where id = $1 and role = 'therapist' and is_active = true`,
        [assignedTherapistId]
    )

    if (!therapist[0]){
        throw new AppError('Therapist not found', 404)
    }

    const { rows } = await query(
        `INSERT INTO patients
        (first_name, last_name, date_of_birth, phone, email, address, therapist_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [first_name, last_name, date_of_birth || null, phone || null,
        email || null, address || null, assignedTherapistId, notes || null]
    )

    await createAuditEvent({
      userId: req.user.userId,
      action: 'CREATE_PATIENT',
      entity: 'patient',
      entityId: rows[0].id,
      payload: { after: rows[0] }
    }).catch(err => console.error('[AUDIT] Failed:', err.message))

    res.status(201).json(rows[0])
}

export const updatePatient = async (req, res) => {
  const { first_name, last_name, date_of_birth, phone, email, address, notes, therapist_id } = req.body

  const { rows: existing } = await query(
    'SELECT * FROM patients WHERE id = $1 AND is_active = true',
    [req.params.id]
  )

  const patient = existing[0]
  if (!patient) {
    throw new AppError('Patient not found', 404)
  }

  // Therapist ownership check
  if (req.user.role === 'therapist' && patient.therapist_id !== req.user.userId) {
    throw new AppError('Patient not found', 404)
  }

  // Only admin can reassign a patient to a different therapist
  const newTherapistId = req.user.role === 'admin' ? (therapist_id || patient.therapist_id) : patient.therapist_id

  const { rows } = await query(
    `UPDATE patients SET
       first_name    = COALESCE($1, first_name),
       last_name     = COALESCE($2, last_name),
       date_of_birth = COALESCE($3, date_of_birth),
       phone         = COALESCE($4, phone),
       email         = COALESCE($5, email),
       address       = COALESCE($6, address),
       notes         = COALESCE($7, notes),
       therapist_id  = $8,
       updated_at    = NOW()
     WHERE id = $9
     RETURNING *`,
    [first_name, last_name, date_of_birth, phone, email, address, notes, newTherapistId, req.params.id]
  )

  await createAuditEvent({
      userId: req.user.userId,
      action: 'UPDATE_PATIENT',
      entity: 'patient',
      entityId: rows[0].id,
      payload: { before: patient, after: rows[0] }
    }).catch(err => console.error('[AUDIT] Failed:', err.message))

  res.json(rows[0])
}

export const deletePatient = async (req, res) => {
  const { rows } = await query(
    'SELECT id FROM patients WHERE id = $1 AND is_active = true',
    [req.params.id]
  )

  if (!rows[0]) {
    throw new AppError('Patient not found', 404)
  }

  await query(
    'UPDATE patients SET is_active = false, updated_at = NOW() WHERE id = $1',
    [req.params.id]
  )

  await createAuditEvent({
      userId: req.user.userId,
      action: 'DELETE_PATIENT',
      entity: 'patient',
      entityId: req.params.id,
      payload: { note: 'Patient deactivated (soft delete)' }
    }).catch(err => console.error('[AUDIT] Failed:', err.message))

  res.status(204).send()
}