const userSchemas = {
  me: {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          first_name: { type: ['string', 'null'] },
          last_name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          avatar: { type: ['string', 'null'] },
          linkedin: { type: ['object', 'null'] },
          infojobs: { type: ['object', 'null'] },
          created_at: { type: 'string' }
        }
      }
    }
  }
};

export { userSchemas };