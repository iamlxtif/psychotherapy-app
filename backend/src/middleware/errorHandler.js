export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Internal server error'

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${statusCode}] ${err.message}`)
    if (!err.isOperational) console.error(err.stack)
  }

  res.status(statusCode).json({ error: message })
}