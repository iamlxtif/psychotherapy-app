import jwt from 'jsonwebtoken'
import { AppError } from "../utils/AppError.js"


export const authenticate = (req, res, next) => {
    
    const header = req.headers.authorization 
    
    if (!header || !header.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401)
    }

    const token = header.split(' ')[1]

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload
        next()
    } catch {
        throw new AppError('Invalid or expired token', 401)
    }
}