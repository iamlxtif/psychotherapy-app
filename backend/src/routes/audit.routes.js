import { Router } from 'express'
import { getAuditEvents, getPatientAuditTrail } from '../controllers/audit.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// All audit routes — admin only
router.use(authenticate)
router.use(authorize('admin'))

router.get('/', asyncHandler(getAuditEvents))
router.get('/patient/:id', asyncHandler(getPatientAuditTrail))

export default router