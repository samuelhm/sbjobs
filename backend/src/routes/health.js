import { getPool } from '../init/database.js';

export default async function (fastify) {
  fastify.get('/health', async (request, reply) => {
    try {
      const client = await getPool().connect();
      await client.query('SELECT NOW()');
      client.release();
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      fastify.log.error({ err }, 'Database health check failed');
      // 503 signals that a critical dependency is unavailable.
      reply.code(503);
      return {
        status: 'error',
        database: 'disconnected',
        error: 'Service temporarily unavailable'
      };
    }
  });
}