import { buildApp } from './app.js';
import { config } from './config/index.js';

const start = async () => {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: config.app.port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();