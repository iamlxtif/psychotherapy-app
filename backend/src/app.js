import './config/env.js' // validates env vars first — before anything else 
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import patientsRoutes from './routes/patients.routes.js'
import appointmentsRoutes from './routes/appointments.routes.js'
import sessionsRoutes from './routes/sessions.routes.js'
import auditRoutes from './routes/audit.routes.js'
import { config } from './config/env.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'

const app = express()

// ── Core Middleware ──────────────────────────────────────────
app.use(helmet())
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(express.json())

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Psychotherapy Center API Docs',
  swaggerOptions: {
    persistAuthorization: true
  }
}))


// ── Routes 
app.use('/api/auth', authRoutes)      
app.use('/api/users', usersRoutes)     
app.use('/api/patients', patientsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/sessions', sessionsRoutes) 
app.use('/api/audit', auditRoutes)     

// ── Error Handling ───────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)


export default app