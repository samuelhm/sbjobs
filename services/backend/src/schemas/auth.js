export const registerSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      password: { type: 'string', minLength: 8 },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      phone: { type: 'string' },
      avatar: { type: 'string' },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      password: { type: 'string', minLength: 1 },
    },
  },
};
