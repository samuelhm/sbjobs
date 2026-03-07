import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyPostgres from '@fastify/postgres';
import fastifyCookie from '@fastify/cookie';

import authRoutes from './routes/auth.js';
import crudRoutes from './routes/crud.js';
import n8nRoutes from './routes/n8n.js';
import { HttpError, toErrorResponse } from './utils/errors.js';

export const buildApp = async (options = {}) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  const SECURE_COOKIE = process.env.SECURE_COOKIE === 'true';
  const HTTP_ONLY_COOKIE = process.env.HTTP_ONLY_COOKIE !== 'false';
  const POSTGRES_CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING;

  const fastify = Fastify({ logger: true });

  const jwtCookieOptions = {
    path: '/',
    httpOnly: HTTP_ONLY_COOKIE,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
  };

  fastify.decorate('jwtCookieOptions', jwtCookieOptions);

  fastify.register(fastifyCookie);
  fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  if (options.queryHandler) {
    fastify.decorate('pg', {
      query: options.queryHandler,
    });
  } else {
    fastify.register(fastifyPostgres, {
      connectionString: POSTGRES_CONNECTION_STRING,
    });
  }

  fastify.decorate('authenticate', async (request, _reply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    if (!request.user?.sub) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    if (typeof request.user.sub === 'string') {
      request.user.sub = Number(request.user.sub);
    }
  });

  fastify.get('/', async () => {
    return {
      status: 'ok',
      message: 'El servicio backend de sbjobs esta funcionando perfectamente.',
    };
  });

  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(n8nRoutes, { prefix: '/n8n' });
  fastify.register(
    async (instance) => {
      instance.addHook('preHandler', instance.authenticate);
      instance.register(crudRoutes);
    },
    { prefix: '/api' },
  );

  fastify.setErrorHandler((error, _request, reply) => {
    const response = toErrorResponse(error);
    reply.code(response.statusCode).send(response.body);
  });

  await fastify.ready();
  return fastify;
};
