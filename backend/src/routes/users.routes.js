import { Router } from 'express'
import { getUsers, getUserById, createUser, updateUser } from '../controllers/users.controller.js'
import { authenticate } from '../middleware/auth.js'
import { authorize } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Staff account management — admin only
 */

router.use(authenticate)
router.use(authorize('admin'))


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all staff accounts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Array of staff accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden — admin only
 *   post:
 *     summary: Create a staff account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, therapist, receptionist]
 *     responses:
 *       201:
 *         description: Staff account created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden — admin only
 *       409:
 *         description: Email already in use
 * 
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get one staff member
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update staff (name, role, is_active)
 *     tags: [Users]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, therapist, receptionist]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated staff member
 *       400:
 *         description: Cannot deactivate own account
 *       404:
 *         description: User not found
 */


router.get('/', asyncHandler(getUsers))
router.get('/:id', asyncHandler(getUserById))
router.post('/', asyncHandler(createUser))
router.put('/:id', asyncHandler(updateUser))

export default router