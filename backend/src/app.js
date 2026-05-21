import './config/env.js' // validates env vars first — before anything else
import './config/db.js'   
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import { config } from './config/env.js'

const app = express()

// ── Core Middleware ──────────────────────────────────────────
app.use(helmet())
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(express.json())

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})


// ── Routes (added per day) ───────────────────────────────────
app.use('/api/auth', authRoutes)      
app.use('/api/users', usersRoutes)     
// app.use('/api/patients', patientRoutes) ← Day 25
// app.use('/api/appointments', appointmentRoutes) ← Day 25
// app.use('/api/sessions', sessionRoutes) ← Day 26
// app.use('/api/audit', auditRoutes)     ← Day 26

// ── Error Handling ───────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} (${config.nodeEnv})`)
})

export default app