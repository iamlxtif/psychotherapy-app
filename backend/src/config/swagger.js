import swaggerJsdoc from 'swagger-jsdoc'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Psychotherapy Center API',
            version: '1.1.0',
            description: `
REST API for managing patients, therapists, appointments, and clinical session notes.

## Authentication
This API uses JWT Bearer tokens. To authenticate:
1. Call \`POST /api/auth/login\` with your credentials
2. Copy the \`token\` from the response
3. Click the **Authorize** button above and enter: \`Bearer <your_token>\`

## Roles
| Role | Permissions |
|------|-------------|
| \`admin\` | Full access to all resources |
| \`therapist\` | Own patients, own appointments, own sessions |
| \`receptionist\` | All appointments (scheduling only), no clinical data |
      `
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                ? 'https://your-app.railway.app'
                : `http://localhost:${process.env.PORT || 3001}`,
                description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token. Get one from POST /api/auth/login'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Resource not found' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', example: 'therapist@clinic.com' },
                        name: { type: 'string', example: 'Dr. Sarah Ahmed' },
                        role: { type: 'string', enum: ['admin', 'therapist', 'receptionist'] },
                        is_active: { type: 'boolean', example: true },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        first_name: { type: 'string', example: 'Ahmed' },
                        last_name: { type: 'string', example: 'Benali' },
                        date_of_birth: { type: 'string', format: 'date', example: '1990-05-15' },
                        phone: { type: 'string', example: '0550123456' },
                        email: { type: 'string', example: 'ahmed@example.com' },
                        therapist_id: { type: 'integer', example: 2 },
                        is_active: { type: 'boolean', example: true }
                    }
                },
                Appointment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        patient_id: { type: 'integer', example: 1 },
                        therapist_id: { type: 'integer', example: 2 },
                        scheduled_at: { type: 'string', format: 'date-time', example: '2026-06-01T10:00:00Z' },
                        duration_mins: { type: 'integer', example: 50 },
                        status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show'] }
                    }
                },
                Session: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        appointment_id: { type: 'integer', example: 1 },
                        patient_id: { type: 'integer', example: 1 },
                        therapist_id: { type: 'integer', example: 2 },
                        notes: { type: 'string', example: 'Patient showed significant progress.' },
                        mood_rating: { type: 'integer', minimum: 1, maximum: 10, example: 7 }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js']
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec