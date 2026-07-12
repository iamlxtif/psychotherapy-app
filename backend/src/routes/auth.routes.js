import { Router } from 'express'
import { login, getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/login:
 *  post:
*      summary: Login and receive a JWT token
*      tags: [Auth]
*      security: []
*      requestBody:
*        required: true
*        content: 
*          application/json:
*            schema:
*              type: object
*              required: [email, password]
*              properties: 
*                email: 
*                  type: string
*                  example: admin@clinic.com 
*                password:
*                  type: string
*                  example: admin123
*      responses:
*        200:
*          description: Login successful
*          content: 
*            application/json:
*              schema:
*                type: object 
*                properties: 
*                  token: 
*                    type: string
*                  user: 
*                    $ref: '#/components/schemas/User'
*        404:
*          description: Invalid Credentials
*          content:
*            application/json:
*              schema: 
*                $ref: '#/components/schemas/Error'
 *                          
 */

router.post('/login', asyncHandler(login))

/**
 *  @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses: 
 *     200:
 *       description: Current user profile
 *       content: 
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     404:
 *       description: No token or invalid token
 *       
 *    
 */

router.get('/me', authenticate, asyncHandler(getMe))

export default router