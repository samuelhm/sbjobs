const schemaFromField = (fieldConfig) => {
  const schema = { type: fieldConfig.type };

  if (fieldConfig.enum) {
    schema.enum = fieldConfig.enum;
  }

  if (fieldConfig.format) {
    schema.format = fieldConfig.format;
  }

  if (fieldConfig.type === 'object') {
    schema.additionalProperties = true;
  }

  return schema;
};

export const buildCrudSchemas = (resource) => {
  const propertySchema = Object.fromEntries(
    Object.entries(resource.fields).map(([field, config]) => [field, schemaFromField(config)]),
  );

  return {
    create: {
      body: {
        type: 'object',
        additionalProperties: false,
        required: resource.createRequired,
        properties: propertySchema,
      },
    },
    update: {
      params: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: propertySchema,
      },
    },
    list: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
    },
    byId: {
      params: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 },
        },
      },
    },
  };
};
