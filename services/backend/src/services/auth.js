import { hashPassword, verifyPassword } from '../utils/password.js';
import { HttpError } from '../utils/errors.js';

export const registerUser = async (fastify, payload) => {
  const email = payload.email.trim().toLowerCase();
  const passwordHash = await hashPassword(payload.password);

  const sql = `
    INSERT INTO users (email, password_hash, first_name, last_name, phone, avatar)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, first_name, last_name, phone, avatar, created_at, updated_at
  `;

  const params = [
    email,
    passwordHash,
    payload.first_name ?? null,
    payload.last_name ?? null,
    payload.phone ?? null,
    payload.avatar ?? null,
  ];

  const result = await fastify.pg.query(sql, params);
  return result.rows[0];
};

export const loginUser = async (fastify, payload) => {
  const sql = `
    SELECT id, email, password_hash
    FROM users
    WHERE lower(email) = lower($1)
  `;

  const result = await fastify.pg.query(sql, [payload.email]);
  const user = result.rows[0];

  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid.');
  }

  const isValid = await verifyPassword(payload.password, user.password_hash);
  if (!isValid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is invalid.');
  }

  return {
    id: user.id,
    email: user.email,
  };
};
