import { loginController, logoutController, registerController } from '../controllers/auth.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';

const authRoutes = async (fastify) => {
  fastify.post('/register', { schema: registerSchema }, registerController);
  fastify.post('/login', { schema: loginSchema }, loginController);
  fastify.post('/logout', { preHandler: fastify.authenticate }, logoutController);
};

export default authRoutes;
