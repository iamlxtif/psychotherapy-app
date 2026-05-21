import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

export const login = async (req, res) => {
    const { email, password } = req.body

    if(!email || !password) {
        throw new AppError('Email and password are required', 400)
    }

    const { rows } = await query(
        `select id, email, name, role, password_hash, is_active from users where email = $1`,
        [email]
    )

    const user = rows[0]

    if(!user) {
        throw new AppError('Invalid email or password', 401)
    }

    if(!user.is_active) {
        throw new AppError('Account is deactivated', 403)
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if(!validPassword) {
        throw new AppError('Invalid email or password', 401)
    }

    const token = jwt.sign(
        { userId : user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )

    res.json({
        token, 
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    })
}

export const getMe = async (req, res) => {
    const { rows } = await query(
        'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1',
        [req.user.userId]
    )

    if (!rows[0]){
        throw new AppError('User not found', 404)
    }

    res.json(rows[0])
}