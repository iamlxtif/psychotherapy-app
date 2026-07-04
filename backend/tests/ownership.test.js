import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { resetDatabase, closePool } from './setup.js'
import { getTokens, createTestPatient, createTestAppointment } from './helpers.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await closePool()
})

describe('Patient ownership isolation', () => {
  it('therapist only sees their own patients in list', async () => {
    const { admin, therapist, therapist2 } = await getTokens()

    // Create one patient per therapist
    await createTestPatient(admin, 2)   // assigned to therapist (id=2)
    await createTestPatient(admin, 3)   // assigned to therapist2 (id=3)

    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${therapist}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].therapist_name).toBe('Dr. Test Therapist')
  })

  it('admin sees all patients', async () => {
    const { admin } = await getTokens()

    await createTestPatient(admin, 2)
    await createTestPatient(admin, 3)

    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${admin}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('therapist gets 404 accessing another therapist patient — not 403', async () => {
    const { admin, therapist2 } = await getTokens()

    // Create patient assigned to therapist (id=2)
    const patient = await createTestPatient(admin, 2)

    // Try to access it as therapist2
    const res = await request(app)
      .get(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${therapist2}`)

    // Critical: must be 404, not 403
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Patient not found')
  })

  it('therapist cannot update another therapist patient', async () => {
    const { admin, therapist2 } = await getTokens()

    const patient = await createTestPatient(admin, 2)

    const res = await request(app)
      .put(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${therapist2}`)
      .send({ first_name: 'Hacked' })

    expect(res.status).toBe(404)
  })

  it('receptionist cannot access patients at all', async () => {
    const { receptionist } = await getTokens()

    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${receptionist}`)

    expect(res.status).toBe(403)
  })
})

describe('Session ownership isolation', () => {
  it('therapist gets 404 writing notes for another therapist appointment', async () => {
    const { admin, receptionist, therapist2 } = await getTokens()

    // Create patient and appointment for therapist (id=2)
    const patient = await createTestPatient(admin, 2)
    const appointment = await createTestAppointment(receptionist, patient.id, 2)

    // Try to write notes as therapist2
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist2}`)
      .send({ appointment_id: appointment.id, notes: 'Unauthorized notes' })

    expect(res.status).toBe(404)
  })

  it('therapist only sees their own sessions', async () => {
    const { admin, receptionist, therapist, therapist2 } = await getTokens()

    // Create patient + appointment + session for therapist1
    const patient1 = await createTestPatient(admin, 2)
    const appt1 = await createTestAppointment(receptionist, patient1.id, 2)
    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appt1.id, notes: 'Therapist 1 notes' })

    // Create patient + appointment + session for therapist2
    const patient2 = await createTestPatient(admin, 3)
    const appt2 = await createTestAppointment(receptionist, patient2.id, 3)
    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist2}`)
      .send({ appointment_id: appt2.id, notes: 'Therapist 2 notes' })

    // Each therapist should only see their own session
    const res1 = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)

    expect(res1.body).toHaveLength(1)
    expect(res1.body[0].notes).toBe('Therapist 1 notes')

    const res2 = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${therapist2}`)

    expect(res2.body).toHaveLength(1)
    expect(res2.body[0].notes).toBe('Therapist 2 notes')
  })
})