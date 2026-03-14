import { getPool } from '../init/database.js';

async function findById(id) {
  const result = await getPool().query(
    'SELECT id, email, first_name, last_name, phone, avatar, linkedin, infojobs, created_at FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
}

export { findById };