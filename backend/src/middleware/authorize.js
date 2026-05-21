import { AppError } from "../utils/AppError.js"

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Not authenticated', 401)
        }

        if (!roles.includes(req.user.role)){
            throw new AppError('Forbidden: insufficient permissions', 403)
        }

        next()
    }
}