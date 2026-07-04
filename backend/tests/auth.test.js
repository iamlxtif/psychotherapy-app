import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { closePool, resetDatabase } from './setup.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await closePool()
})

describe('POST /api/auth/login', () => {
    it('returns 200 and token with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@clinic.com', password: 'admin123' })

        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
        expect(res.body.user.email).toBe('admin@clinic.com')
        expect(res.body.user.password_hash).toBeUndefined()
    })

    it('returns 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@clinic.com', password: 'wrongpassword' })
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Invalid email or password')
    })

    it('returns 401 for wrong email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@clinic.com', password: 'admin123' })
        
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Invalid email or password')
    })

    it('returns 403 for deactivated account', async () => {
        const adminToken = (await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@clinic.com', password: 'admin123' })).body.token
        
        await request(app)
            .put('/api/users/2')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ is_active: false })
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'therapist@clinic.com', password: 'therapist123' })

        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Account is deactivated')
    })
})

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.com', password: 'admin123' })

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('admin@clinic.com')
    expect(res.body.password_hash).toBeUndefined()
  })

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.TAMPERED.abc123')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid or expired token')
  })
})