import pg from 'pg'
import { config } from './env.js'


const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,                // max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})


pool.connect((err, client, release) => {
    if(err){
        console.error('[DB] Connection error:', err.message)
    }
    else{
        console.log('[DB] Connected to PostgreSQL')
        release()
    }
})

export const query = (text, params) => pool.query(text, params)  