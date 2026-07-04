import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetDatabase, closePool } from './setup.js'
import { getTokens } from './helpers.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await closePool()
})

describe('Admin-only routes', () => {
  it('therapist cannot access /api/users', async () => {
    const { therapist } = await getTokens()
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${therapist}`)
    expect(res.status).toBe(403)
  })

  it('receptionist cannot access /api/users', async () => {
    const { receptionist } = await getTokens()
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${receptionist}`)
    expect(res.status).toBe(403)
  })

  it('therapist cannot access audit log', async () => {
    const { therapist } = await getTokens()
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${therapist}`)
    expect(res.status).toBe(403)
  })

  it('receptionist cannot access audit log', async () => {
    const { receptionist } = await getTokens()
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${receptionist}`)
    expect(res.status).toBe(403)
  })

  it('admin cannot deactivate their own account', async () => {
    const { admin } = await getTokens()
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', `Bearer ${admin}`)
      .send({ is_active: false })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('You cannot deactivate your own account')
  })
})

describe('Appointment write restrictions', () => {
  it('therapist cannot create appointments', async () => {
    const { admin, therapist } = await getTokens()
    const patient = await (await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${admin}`)
      .send({ first_name: 'Test', last_name: 'Patient', therapist_id: 2 })).body

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ patient_id: patient.id, therapist_id: 2, scheduled_at: '2026-06-01T10:00:00Z' })

    expect(res.status).toBe(403)
  })
})

describe('Session write restrictions', () => {
  it('admin cannot create session notes (therapist only)', async () => {
    const { admin, receptionist } = await getTokens()

    const patient = await (await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${admin}`)
      .send({ first_name: 'Test', last_name: 'Patient', therapist_id: 2 })).body

    const appointment = await (await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionist}`)
      .send({ patient_id: patient.id, therapist_id: 2, scheduled_at: '2026-06-01T10:00:00Z' })).body

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${admin}`)
      .send({ appointment_id: appointment.id, notes: 'Admin notes attempt' })

    expect(res.status).toBe(403)
  })
})