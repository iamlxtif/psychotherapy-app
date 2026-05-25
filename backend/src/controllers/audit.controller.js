import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

// ─────────────────────────────────────────────
// GET /api/audit
// Admin only — list all audit events
// Supports query params: ?entity=patient&action=UPDATE_PATIENT&limit=50
// ─────────────────────────────────────────────
export const getAuditEvents = async (req, res) => {
    const { entity, action, limit = 50 } = req.query

    const { rows } = await query(
        `SELECT
        a.id, a.action, a.entity, a.entity_id,
        a.payload, a.created_at,
        u.name AS performed_by,
        u.role AS performer_role
        FROM audit_events a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE ($1::text IS NULL OR a.entity = $1)
        AND ($2::text IS NULL OR a.action = $2)
        ORDER BY a.created_at DESC
        LIMIT $3`,
        [entity || null, action || null, parseInt(limit)]
    )

    res.json(rows)
    }

    // ─────────────────────────────────────────────
    // GET /api/audit/patient/:id
    // Admin only — full audit trail for one patient
    // ─────────────────────────────────────────────
    export const getPatientAuditTrail = async (req, res) => {
    // Verify patient exists
    const { rows: patient } = await query(
        'SELECT id, first_name, last_name FROM patients WHERE id = $1',
        [req.params.id]
    )

    if (!patient[0]) {
        throw new AppError('Patient not found', 404)
    }

    const { rows } = await query(
        `SELECT
        a.id, a.action, a.payload, a.created_at,
        u.name AS performed_by,
        u.role AS performer_role
        FROM audit_events a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.entity IN ('patient', 'session')
        AND a.entity_id = $1
        ORDER BY a.created_at ASC`,
        [req.params.id]
    )

    res.json({
        patient: patient[0],
        audit_trail: rows,
        total_events: rows.length
    })
}