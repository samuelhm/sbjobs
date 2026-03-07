import { loginUser, registerUser } from '../services/auth.js';

export const registerController = async (request, reply) => {
  const user = await registerUser(request.server, request.body);
  return reply.code(201).send({ data: user });
};

export const loginController = async (request, reply) => {
  const user = await loginUser(request.server, request.body);
  const token = await reply.jwtSign({ sub: user.id, email: user.email });

  reply.setCookie('token', token, request.server.jwtCookieOptions);
  return reply.send({ data: user });
};

export const logoutController = async (request, reply) => {
  reply.clearCookie('token', request.server.jwtCookieOptions);
  return reply.code(204).send();
};
