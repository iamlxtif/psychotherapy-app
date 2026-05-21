import { Router } from 'express'
import { login, getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.get('/me', authenticate, asyncHandler(getMe))

export default router