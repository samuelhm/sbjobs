import * as authService from '../../services/auth.service.js';
import { MESSAGES } from '../../constants/messages.js';
import { cookieOptions } from '../../config/cookie.js';
import { config } from '../../config/index.js';

async function login(request, reply) {
  const { email, password } = request.body;
  
  const user = await authService.login(email, password);
  
  if (!user) {
    reply.code(401);
    throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const token = await reply.jwtSign(
    { id: user.id, email: user.email },
    { expiresIn: config.jwt.expiresIn }
  );

  reply.setCookie('token', token, cookieOptions);
  
  return { user: { id: user.id, email: user.email } };
}

async function register(request, reply) {
  const { email, password, first_name, last_name, phone } = request.body;

  let user;
  try {
    user = await authService.register({
      email,
      password,
      first_name,
      last_name,
      phone
    });
  } catch (err) {
    if (err?.code === '23505') {
      reply.code(409);
      throw new Error(MESSAGES.USER.ALREADY_EXISTS);
    }
    throw err;
  }
  
  reply.code(201);
  return user;
}

async function logout(request, reply) {
  reply.clearCookie('token', cookieOptions);
  return { message: MESSAGES.AUTH.LOGOUT_SUCCESS };
}

export { login, register, logout };