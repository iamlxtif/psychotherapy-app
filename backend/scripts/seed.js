import bcrypt from 'bcrypt'
import pg, { Connection } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function seed () {
    const client = await pool.connect()

    const { rows } = await client.query(
        `select id from users where email = $1`,
        ['admin@clinic.com']
    )

    if (rows.length > 0){
        console.log('⏭  Admin already exists, skipping seed.')
        return
    }

    const password_hash = await bcrypt.hash('admin123', 12)

    await client.query(
        `insert into users (email, password_hash, name, role) values ($1, $2, $3, $4)`,
        ['admin@clinic.com', password_hash, 'System Admin', 'admin']
    )

    console.log('✅ Admin account created.')
    console.log('   Email:    admin@clinic.com')
    console.log('   Password: admin123')
    console.log('   ⚠️  Change this password after first login.')

    client.release()
    await pool.end()
}

seed().catch( err => {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
})