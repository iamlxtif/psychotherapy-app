import { Router } from 'express'
import {
  getAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment
} from '../controllers/appointments.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(authenticate)

// All 3 roles can read appointments
router.get('/', asyncHandler(getAppointments))
router.get('/:id', asyncHandler(getAppointmentById))

// Only admin and receptionist can create/update/cancel
router.post('/', authorize('admin', 'receptionist'), asyncHandler(createAppointment))
router.put('/:id', authorize('admin', 'receptionist'), asyncHandler(updateAppointment))
router.delete('/:id', authorize('admin', 'receptionist'), asyncHandler(cancelAppointment))

export default router