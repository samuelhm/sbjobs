import { getMe } from './handlers.js';
import { userSchemas } from './schemas.js';

export default async function (fastify) {
  fastify.get('/me', { schema: userSchemas.me }, getMe);
}