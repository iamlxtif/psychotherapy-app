import bcrypt from 'bcrypt'
import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

// ─────────────────────────────────────────────
// GET /api/users
// Admin only — list all staff
// ─────────────────────────────────────────────
export const getUsers = async (req, res) => {
  const { rows } = await query(
    `SELECT id, email, name, role, is_active, created_at
     FROM users
     ORDER BY created_at DESC`
  )
  res.json(rows)
}

// ─────────────────────────────────────────────
// GET /api/users/:id
// Admin only — get one staff member
// ─────────────────────────────────────────────
export const getUserById = async (req, res) => {
  const { rows } = await query(
    `SELECT id, email, name, role, is_active, created_at
     FROM users WHERE id = $1`,
    [req.params.id]
  )

  if (!rows[0]) {
    throw new AppError('User not found', 404)
  }

  res.json(rows[0])
}

// ─────────────────────────────────────────────
// POST /api/users
// Admin only — create a staff account
// ─────────────────────────────────────────────
export const createUser = async (req, res) => {
  const { email, password, name, role } = req.body

  if (!email || !password || !name || !role) {
    throw new AppError('email, password, name, and role are required', 400)
  }

  const validRoles = ['admin', 'therapist', 'receptionist']
  if (!validRoles.includes(role)) {
    throw new AppError(`role must be one of: ${validRoles.join(', ')}`, 400)
  }

  // Check for duplicate email
  const { rows: existing } = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )
  if (existing.length > 0) {
    throw new AppError('Email already in use', 409)
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, is_active, created_at`,
    [email, password_hash, name, role]
  )

  res.status(201).json(rows[0])
}

// ─────────────────────────────────────────────
// PUT /api/users/:id
// Admin only — update staff (name, role, is_active)
// ─────────────────────────────────────────────
export const updateUser = async (req, res) => {
  const { name, role, is_active } = req.body

  // Prevent admin from deactivating themselves
  if (req.params.id == req.user.userId && is_active === false) {
    throw new AppError('You cannot deactivate your own account', 400)
  }

  const { rows: existing } = await query(
    'SELECT id FROM users WHERE id = $1',
    [req.params.id]
  )
  if (!existing[0]) {
    throw new AppError('User not found', 404)
  }

  const { rows } = await query(
    `UPDATE users
     SET
       name       = COALESCE($1, name),
       role       = COALESCE($2, role),
       is_active  = COALESCE($3, is_active),
       updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, name, role, is_active, updated_at`,
    [name, role, is_active, req.params.id]
  )

  res.json(rows[0])
}