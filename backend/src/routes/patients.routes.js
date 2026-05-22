import { Router } from 'express'
import {
  getPatients, getPatientById, createPatient, updatePatient, deletePatient
} from '../controllers/patients.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Receptionists are excluded from all patient routes
router.use(authenticate)
router.use(authorize('admin', 'therapist'))

router.get('/', asyncHandler(getPatients))
router.get('/:id', asyncHandler(getPatientById))
router.post('/', asyncHandler(createPatient))
router.put('/:id', asyncHandler(updatePatient))
router.delete('/:id', authorize('admin'), asyncHandler(deletePatient))

export default router