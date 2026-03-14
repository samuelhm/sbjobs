import { getPool } from '../init/database.js';

async function login(email, password) {
  const result = await getPool().query(
    `SELECT id, email
     FROM users
     WHERE email = $1
       AND password_hash = crypt($2, password_hash)`,
    [email, password]
  );
  
  const user = result.rows[0];
  
  if (!user) {
    return null;
  }
  
  return { id: user.id, email: user.email };
}

async function register({ email, password, first_name, last_name, phone }) {
  const result = await getPool().query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5)
     RETURNING id, email, first_name, last_name, phone`,
    [email, password, first_name || null, last_name || null, phone || null]
  );
  
  return result.rows[0];
}

async function findById(id) {
  const result = await getPool().query(
    'SELECT id, email, first_name, last_name, phone, avatar, linkedin, infojobs, created_at FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
}

export { login, register, findById };