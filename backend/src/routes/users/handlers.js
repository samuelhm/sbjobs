import * as usersService from '../../services/users.service.js';
import { MESSAGES } from '../../constants/messages.js';

async function getMe(request, reply) {
  const user = await usersService.findById(request.user.id);
  
  if (!user) {
    reply.code(404);
    throw new Error(MESSAGES.USER.NOT_FOUND);
  }
  
  return user;
}

export { getMe };