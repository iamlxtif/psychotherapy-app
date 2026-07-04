import { Router } from 'express'
import { getUsers, getUserById, createUser, updateUser } from '../controllers/users.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(authenticate)
router.use(authorize('admin'))

router.get('/', asyncHandler(getUsers))
router.get('/:id', asyncHandler(getUserById))
router.post('/', asyncHandler(createUser))
router.put('/:id', asyncHandler(updateUser))

export default router