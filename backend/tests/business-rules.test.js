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

describe('Session business rules', () => {
  it('cannot create duplicate session for same appointment', async () => {
    const { admin, therapist, receptionist } = await getTokens()
    const patient = await createTestPatient(admin, 2)
    const appointment = await createTestAppointment(receptionist, patient.id, 2)
    
    // First session — should succeed
    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appointment.id, notes: 'First notes' })

    // Second session — should fail
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appointment.id, notes: 'Duplicate notes' })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Session notes already exist for this appointment')
  })

  it('creating session sets appointment status to completed', async () => {
    const { admin, therapist, receptionist } = await getTokens()
    const patient = await createTestPatient(admin, 2)
    const appointment = await createTestAppointment(receptionist, patient.id, 2)

    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appointment.id, notes: 'Session notes' })

    const apptRes = await request(app)
      .get(`/api/appointments/${appointment.id}`)
      .set('Authorization', `Bearer ${admin}`)

    expect(apptRes.body.status).toBe('completed')
  })

  it('mood_rating must be between 1 and 10', async () => {
    const { admin, therapist, receptionist } = await getTokens()
    const patient = await createTestPatient(admin, 2)
    const appointment = await createTestAppointment(receptionist, patient.id, 2)

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appointment.id, notes: 'Notes', mood_rating: 11 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('mood_rating must be between 1 and 10')
  })
})

describe('Appointment business rules', () => {
  it('cannot cancel a completed appointment', async () => {
    const { admin, therapist, receptionist } = await getTokens()
    const patient = await createTestPatient(admin, 2)
    const appointment = await createTestAppointment(receptionist, patient.id, 2)

    // Complete it via session creation
    await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${therapist}`)
      .send({ appointment_id: appointment.id, notes: 'Notes' })

    // Try to cancel
    const res = await request(app)
      .delete(`/api/appointments/${appointment.id}`)
      .set('Authorization', `Bearer ${receptionist}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Cannot cancel a completed appointment')
  })
})

describe('Audit trail', () => {
  it('creating a patient writes an audit event', async () => {
    const { admin } = await getTokens()
    const patient = await createTestPatient(admin, 2)

    const auditRes = await request(app)
      .get(`/api/audit/patient/${patient.id}`)
      .set('Authorization', `Bearer ${admin}`)

    expect(auditRes.status).toBe(200)
    expect(auditRes.body.audit_trail).toHaveLength(1)
    expect(auditRes.body.audit_trail[0].action).toBe('CREATE_PATIENT')
  })

  it('updating a patient writes an audit event with before and after', async () => {
    const { admin } = await getTokens()
    const patient = await createTestPatient(admin, 2)

    await request(app)
      .put(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ phone: '0550123456' })

    const auditRes = await request(app)
      .get(`/api/audit/patient/${patient.id}`)
      .set('Authorization', `Bearer ${admin}`)

    const updateEvent = auditRes.body.audit_trail.find(e => e.action === 'UPDATE_PATIENT')
    expect(updateEvent).toBeDefined()
    expect(updateEvent.payload.before.phone).toBeNull()
    expect(updateEvent.payload.after.phone).toBe('0550123456')
  })
})