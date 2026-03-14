const authSchemas = {
  login: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' }
            }
          }
        }
      }
    }
  },
  register: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        phone: { type: 'string' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          email: { type: 'string' },
          first_name: { type: ['string', 'null'] },
          last_name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] }
        }
      }
    }
  },
  logout: {
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  }
};

export { authSchemas };