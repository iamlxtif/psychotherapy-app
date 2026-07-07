import { Router } from 'express'
import {
  getAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment
} from '../controllers/appointments.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment scheduling
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: List appointments (therapist sees own, others see all)
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Array of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *   post:
 *     summary: Create an appointment — admin and receptionist only
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, therapist_id, scheduled_at]
 *             properties:
 *               patient_id:
 *                 type: integer
 *               therapist_id:
 *                 type: integer
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               duration_mins:
 *                 type: integer
 *                 default: 50
 *     responses:
 *       201:
 *         description: Appointment created
 *       403:
 *         description: Forbidden — therapists cannot create appointments
 */

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get one appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment record
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update appointment — admin and receptionist only
 *     tags: [Appointments]
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
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, no_show]
 *     responses:
 *       200:
 *         description: Updated appointment
 *   delete:
 *     summary: Cancel appointment — admin and receptionist only
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Appointment cancelled
 *       400:
 *         description: Cannot cancel a completed appointment
 */
router.use(authenticate)

// All 3 roles can read appointments
router.get('/', asyncHandler(getAppointments))
router.get('/:id', asyncHandler(getAppointmentById))

// Only admin and receptionist can create/update/cancel
router.post('/', authorize('admin', 'receptionist'), asyncHandler(createAppointment))
router.put('/:id', authorize('admin', 'receptionist'), asyncHandler(updateAppointment))
router.delete('/:id', authorize('admin', 'receptionist'), asyncHandler(cancelAppointment))

export default router