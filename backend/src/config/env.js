import dotenv from 'dotenv'

dotenv.config({ 
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true
})

const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT']

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

export const config = {
  port: parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
}