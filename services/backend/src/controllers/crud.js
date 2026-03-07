import { HttpError } from '../utils/errors.js';

export const createCrudController = (service) => ({
  list: async (request) => {
    const rows = await service.list(request.user.sub, request.query);
    return { data: rows };
  },

  getById: async (request) => {
    const row = await service.getById(request.user.sub, request.params.id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Resource not found.');
    }
    return { data: row };
  },

  create: async (request, reply) => {
    const row = await service.create(request.user.sub, request.body);
    return reply.code(201).send({ data: row });
  },

  update: async (request) => {
    const row = await service.update(request.user.sub, request.params.id, request.body);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Resource not found.');
    }
    return { data: row };
  },

  remove: async (request, reply) => {
    const row = await service.remove(request.user.sub, request.params.id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Resource not found.');
    }
    return reply.code(204).send();
  },
});
