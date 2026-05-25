import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { createAuditEvent } from '../utils/audit.js'

export const getSessions = async (req, res) => {
    const isAdmin = req.user.role === 'admin'

    const { rows } = await query(
        `select s.id, s.mood_rating, s.created_at, s.updated_at,
        s.notes,
        p.first_name || ' ' || p.last_name AS patient_name,
        u.name AS therapist_name,
        a.scheduled_at AS appointment_date
        from sessions s join patients p on p.id = s.patient_id
        join users u on u.id = s.therapist_id
        join appointments a on a.id = s.appointment_id
        where ($1 or s.therapist_id = $2)
        ORDER BY s.created_at DESC`,
        [isAdmin, req.user.userId]
    )

    res.json(rows)
}

export const getSessionById = async (req, res) => {
    
    const { rows } = await query(
        `select s.id, s.mood_rating, s.created_at, s.updated_at,
        s.notes,
        p.first_name || ' ' || p.last_name AS patient_name,
        u.name AS therapist_name,
        a.scheduled_at AS appointment_date
        from sessions s join patients p on s.patient_id = p.id
        join users u on s.therapist_id = u.id
        join appointments a on s.appointment_id = a.id
        where s.id = $1`,
        [req.params.id]
    )

    const session = rows[0]

    if (!session){
        throw new AppError('Session not found', 404)
    }

    if (req.user.role === 'therapist' && req.user.userId !== session.therapist_id){
        throw new AppError('Session not found', 404)
    }

    res.json(session)
}

export const createSession = async (req, res) => {
    const { appointment_id, notes, mood_rating } = req.body

    if(!appointment_id || !notes) {
        throw new AppError('appointment_id and notes are required', 400)
    }

    const { rows: apptRows } = await query(
        `select * from appointments
        where id = $1`, 
        [appointment_id]
    )

    const appointment = apptRows[0]

    if (!appointment) {
        throw new AppError('Appointment not found', 404)
    }

    if (appointment.therapist_id !== req.user.userId) {
        throw new AppError('Appointment not found', 404)
    }

    if (['cancelled', 'no_show'].includes(appointment.status)) {
        throw new AppError(`Cannot write notes for a ${appointment.status} appointment`, 400)
    }

    const { rows: existingSession } = await query(
        'SELECT id FROM sessions WHERE appointment_id = $1',
        [appointment_id]
    )
    if (existingSession.length > 0) {
        throw new AppError('Session notes already exist for this appointment', 409)
    }

    if (mood_rating !== undefined && (mood_rating < 1 || mood_rating > 10)) {
        throw new AppError('mood_rating must be between 1 and 10', 400)
    }

    const { rows } = await query(
        `INSERT INTO sessions (appointment_id, patient_id, therapist_id, notes, mood_rating)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [appointment_id, appointment.patient_id, req.user.userId, notes, mood_rating || null]
    )

    await query(
        `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [appointment_id]
    )

    await createAuditEvent({
        userId: req.user.userId,
        action: 'CREATE_SESSION',
        entity: 'session',
        entityId: rows[0].id,
        payload: { appointment_id, patient_id: appointment.patient_id }
    }).catch(err => console.error('[AUDIT] Failed:', err.message))

    res.status(201).json(rows[0])
}

export const updateSession = async (req, res) => {
    const { notes, mood_rating } = req.body

    const { rows: existing } = await query(
        'SELECT * FROM sessions WHERE id = $1',
        [req.params.id]
    )

    const session = existing[0]
    if (!session) {
        throw new AppError('Session not found', 404)
    }

    // Ownership check
    if (req.user.role === 'therapist' && session.therapist_id !== req.user.userId) {
        throw new AppError('Session not found', 404)
    }

    if (mood_rating !== undefined && (mood_rating < 1 || mood_rating > 10)) {
        throw new AppError('mood_rating must be between 1 and 10', 400)
    }

    const { rows } = await query(
        `UPDATE sessions SET
        notes       = COALESCE($1, notes),
        mood_rating = COALESCE($2, mood_rating),
        updated_at  = NOW()
        WHERE id = $3
        RETURNING *`,
        [notes, mood_rating, req.params.id]
    )

    // Audit write
    await createAuditEvent({
        userId: req.user.userId,
        action: 'UPDATE_SESSION',
        entity: 'session',
        entityId: rows[0].id,
        payload: { before: session, after: rows[0] }
    }).catch(err => console.error('[AUDIT] Failed:', err.message))

    res.json(rows[0])
}