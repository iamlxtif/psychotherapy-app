import { Router } from 'express'
import {
  getPatients, getPatientById, createPatient, updatePatient, deletePatient
} from '../controllers/patients.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management — admin and therapist only
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: List patients (therapist sees own only, admin sees all)
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Array of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       403:
 *         description: Forbidden — receptionists excluded
 *   post:
 *     summary: Create a patient
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               therapist_id:
 *                 type: integer
 *                 description: Required for admin. Therapists are auto-assigned to themselves.
 *     responses:
 *       201:
 *         description: Patient created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get one patient (therapist ownership enforced)
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found (or not yours as therapist)
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated patient
 *       404:
 *         description: Patient not found
 *   delete:
 *     summary: Deactivate a patient — admin only
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Patient deactivated
 *       403:
 *         description: Forbidden — admin only
 */

// Receptionists are excluded from all patient routes
router.use(authenticate)
router.use(authorize('admin', 'therapist'))

router.get('/', asyncHandler(getPatients))
router.get('/:id', asyncHandler(getPatientById))
router.post('/', asyncHandler(createPatient))
router.put('/:id', asyncHandler(updatePatient))
router.delete('/:id', authorize('admin'), asyncHandler(deletePatient))

export default router