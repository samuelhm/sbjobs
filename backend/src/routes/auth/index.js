import { login, register, logout } from './handlers.js';
import { authSchemas } from './schemas.js';

export default async function (fastify) {
  fastify.post('/login', { schema: authSchemas.login }, login);
  fastify.post('/register', { schema: authSchemas.register }, register);
  fastify.post('/logout', { schema: authSchemas.logout }, logout);
}