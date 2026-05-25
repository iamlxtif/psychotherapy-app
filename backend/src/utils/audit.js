import { query } from '../config/db.js' 

export const createAuditEvent = async ({ userId, action, entity, entityId, payload }) => {
    await query(
        `insert into audit_events(user_id, action, entity, entity_id, payload)
        values($1, $2, $3, $4, $5)`,
        [userId, action, entity, entityId, JSON.stringify(payload)]
    )
}