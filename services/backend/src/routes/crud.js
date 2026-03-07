import { createCrudController } from '../controllers/crud.js';
import { resourceList } from '../config/resources.js';
import { buildCrudSchemas } from '../schemas/crud.js';
import { createCrudService } from '../services/crud.js';

const crudRoutes = async (fastify) => {
  for (const resource of resourceList) {
    const service = createCrudService(fastify, resource);
    const controller = createCrudController(service);
    const schemas = buildCrudSchemas(resource);
    const prefix = `/${resource.path}`;

    fastify.get(prefix, { schema: schemas.list }, controller.list);

    if (resource.allowCreate) {
      fastify.post(prefix, { schema: schemas.create }, controller.create);
    }

    fastify.get(`${prefix}/:id`, { schema: schemas.byId }, controller.getById);
    fastify.patch(`${prefix}/:id`, { schema: schemas.update }, controller.update);
    fastify.delete(`${prefix}/:id`, { schema: schemas.byId }, controller.remove);
  }
};

export default crudRoutes;
