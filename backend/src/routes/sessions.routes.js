import { Router } from 'express'
import { getSessions, getSessionById, createSession, updateSession } from '../controllers/sessions.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Receptionists excluded from all session routes
router.use(authenticate)
router.use(authorize('admin', 'therapist'))

router.get('/', asyncHandler(getSessions))
router.get('/:id', asyncHandler(getSessionById))

// Only therapists can write session notes (admin can update for corrections)
router.post('/', authorize('therapist'), asyncHandler(createSession))
router.put('/:id', asyncHandler(updateSession))

export default router