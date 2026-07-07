import { Router } from 'express'
import { getSessions, getSessionById, createSession, updateSession } from '../controllers/sessions.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Clinical session notes — therapist and admin only
 */

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: List sessions (therapist sees own, admin sees all)
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: Array of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       403:
 *         description: Forbidden — receptionists excluded
 *   post:
 *     summary: Create session notes — therapist only
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointment_id, notes]
 *             properties:
 *               appointment_id:
 *                 type: integer
 *               notes:
 *                 type: string
 *               mood_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       201:
 *         description: Session notes created. Appointment status auto-set to completed.
 *       403:
 *         description: Forbidden — admin and receptionists cannot write session notes
 *       409:
 *         description: Session notes already exist for this appointment
 */

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get one session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session record
 *       404:
 *         description: Not found (or not yours as therapist)
 *   put:
 *     summary: Update session notes
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               mood_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Updated session
 */
// Receptionists excluded from all session routes
router.use(authenticate)
router.use(authorize('admin', 'therapist'))

router.get('/', asyncHandler(getSessions))
router.get('/:id', asyncHandler(getSessionById))

// Only therapists can write session notes (admin can update for corrections)
router.post('/', authorize('therapist'), asyncHandler(createSession))
router.put('/:id', asyncHandler(updateSession))

export default router