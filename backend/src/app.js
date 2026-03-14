import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { config } from './config/index.js';
import { initDatabase } from './init/database.js';
import authGuard from './plugins/auth-guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildApp() {
  const isDev = config.app.nodeEnv === 'development';
  
  let loggerConfig;
  if (isDev) {
    try {
      await import('pino-pretty');
      loggerConfig = { level: 'debug', transport: { target: 'pino-pretty', options: { colorize: true } } };
    } catch {
      loggerConfig = { level: 'debug' };
    }
  } else {
    loggerConfig = { level: 'warn' };
  }

  const fastify = Fastify({ logger: loggerConfig });

  initDatabase(fastify);

  await fastify.register(cookie);

  await fastify.register(jwt, {
    secret: config.jwt.secret
  });

  await fastify.register(authGuard);

  await fastify.register(autoload, {
    dir: join(__dirname, 'routes')
  });

  return fastify;
}

export { buildApp };