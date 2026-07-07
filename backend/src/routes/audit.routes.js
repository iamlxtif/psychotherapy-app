import { Router } from 'express'
import { getAuditEvents, getPatientAuditTrail } from '../controllers/audit.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Compliance audit log — admin only
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: List audit events
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g. patient, session)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (e.g. UPDATE_PATIENT)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Array of audit events
 *       403:
 *         description: Forbidden — admin only
 */

/**
 * @swagger
 * /api/audit/patient/{id}:
 *   get:
 *     summary: Get full audit trail for one patient
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient audit trail with before/after payload
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Patient not found
 */
// All audit routes — admin only
router.use(authenticate)
router.use(authorize('admin'))

router.get('/', asyncHandler(getAuditEvents))
router.get('/patient/:id', asyncHandler(getPatientAuditTrail))

export default router