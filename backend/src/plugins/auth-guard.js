import fp from 'fastify-plugin';
import { MESSAGES } from '../constants/messages.js';

const PUBLIC_ROUTES = ['/health', '/auth/login', '/auth/register'];

export default fp(async function authGuardPlugin(fastify) {
  fastify.addHook('onRequest', async (request, reply) => {
    const isPublic = PUBLIC_ROUTES.some((route) => request.url.startsWith(route));

    if (isPublic) {
      return;
    }

    const token = request.cookies?.token;

    if (!token) {
      reply.code(401);
      throw new Error(MESSAGES.AUTH.UNAUTHORIZED);
    }

    try {
      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch {
      reply.code(401);
      throw new Error(MESSAGES.AUTH.TOKEN_INVALID);
    }
  });
});