import request from 'supertest'
import app from '../src/app.js'

export const loginAs = async(email, password) => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
    
    return res.body.token
}

export const getTokens = async () => {
    const [admin, therapist, therapist2, receptionist] = await Promise.all([
        loginAs('admin@clinic.com', 'admin123'),
        loginAs('therapist@clinic.com', 'therapist123'),
        loginAs('therapist2@clinic.com', 'therapist123'),
        loginAs('reception@clinic.com', 'reception123')
    ])
    return {admin, therapist, therapist2, receptionist}
}

export const createTestPatient = async (adminToken, therapistId = 2) => {
    const res = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            first_name: 'Test',
            last_name: 'Patient',
            therapist_id: therapistId
        })
    return res.body
}

export const createTestAppointment = async (receptionistToken, patientId, therapistId = 2) => {
    const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
            patient_id: patientId,
            therapist_id: therapistId,
            scheduled_at: '2026-06-01T10:00:00Z'
        })
    
    return res.body
}

export { request, app }