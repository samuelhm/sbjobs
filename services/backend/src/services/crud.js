import { HttpError } from '../utils/errors.js';

const sanitizePayload = (resource, payload) => {
  const allowedFields = new Set(Object.keys(resource.fields));
  const entries = Object.entries(payload).filter(([key, value]) => allowedFields.has(key) && value !== undefined);
  return Object.fromEntries(entries);
};

const buildOwnership = (resource, userId, userParamIndex) => {
  const ownership = resource.ownership;

  if (ownership.type === 'none') {
    return {
      clause: 'TRUE',
      params: [],
    };
  }

  if (ownership.type === 'userColumn') {
    return {
      clause: `t.${ownership.userColumn} = $${userParamIndex}`,
      params: [userId],
    };
  }

  if (ownership.type === 'selfUser') {
    return {
      clause: `t.${resource.idColumn} = $${userParamIndex}`,
      params: [userId],
    };
  }

  if (ownership.type === 'existsJoin') {
    return {
      clause: ownership.predicate.replace('%USER_PARAM%', String(userParamIndex)),
      params: [userId],
    };
  }

  throw new Error(`Unsupported ownership type: ${ownership.type}`);
};

const ensureCreateAllowed = async (resource, payload, userId, fastify) => {
  if (!resource.createGuard) {
    return;
  }

  const sourceValue = payload[resource.createGuard.sourceField];
  if (!sourceValue) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Missing field '${resource.createGuard.sourceField}'.`);
  }

  const result = await fastify.pg.query(resource.createGuard.sql, [sourceValue, userId]);
  if (!result.rows[0]?.allowed) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not have access to the selected parent resource.');
  }
};

const withOwnerFieldIfNeeded = (resource, payload, userId) => {
  if (resource.ownership.type === 'userColumn') {
    return {
      ...payload,
      [resource.ownership.userColumn]: userId,
    };
  }

  return payload;
};

export const createCrudService = (fastify, resource) => {
  const list = async (userId, query = {}) => {
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const ownership = buildOwnership(resource, userId, 1);
    const limitParamIndex = ownership.params.length + 1;
    const offsetParamIndex = ownership.params.length + 2;

    const sql = `
      SELECT t.*
      FROM ${resource.table} t
      WHERE ${ownership.clause}
      ORDER BY t.${resource.idColumn} DESC
      LIMIT $${limitParamIndex}
      OFFSET $${offsetParamIndex}
    `;

    const params = [...ownership.params, limit, offset];
    const result = await fastify.pg.query(sql, params);
    return result.rows;
  };

  const getById = async (userId, id) => {
    const ownership = buildOwnership(resource, userId, 1);
    const idParamIndex = ownership.params.length + 1;

    const sql = `
      SELECT t.*
      FROM ${resource.table} t
      WHERE t.${resource.idColumn} = $${idParamIndex} AND ${ownership.clause}
    `;

    const result = await fastify.pg.query(sql, [...ownership.params, id]);
    return result.rows[0] ?? null;
  };

  const create = async (userId, payload) => {
    const cleanPayload = withOwnerFieldIfNeeded(resource, sanitizePayload(resource, payload), userId);
    await ensureCreateAllowed(resource, cleanPayload, userId, fastify);

    const fields = Object.keys(cleanPayload);
    if (fields.length === 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No data provided for create operation.');
    }

    const columnsSql = fields.join(', ');
    const valuesSql = fields.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `
      INSERT INTO ${resource.table} (${columnsSql})
      VALUES (${valuesSql})
      RETURNING *
    `;

    const result = await fastify.pg.query(sql, fields.map((field) => cleanPayload[field]));
    return result.rows[0];
  };

  const update = async (userId, id, payload) => {
    const cleanPayload = sanitizePayload(resource, payload);
    const fields = Object.keys(cleanPayload);

    if (fields.length === 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No data provided for update operation.');
    }

    const valueParams = fields.map((field) => cleanPayload[field]);
    const setExpressions = fields.map((field, index) => `${field} = $${index + 1}`);

    if (resource.hasUpdatedAt) {
      setExpressions.push('updated_at = now()');
    }

    const ownership = buildOwnership(resource, userId, valueParams.length + 2);
    const idParamIndex = valueParams.length + 1;

    const sql = `
      UPDATE ${resource.table} t
      SET ${setExpressions.join(', ')}
      WHERE t.${resource.idColumn} = $${idParamIndex} AND ${ownership.clause}
      RETURNING t.*
    `;

    const params = [...valueParams, id, ...ownership.params];
    const result = await fastify.pg.query(sql, params);
    return result.rows[0] ?? null;
  };

  const remove = async (userId, id) => {
    const idParamIndex = 1;
    const ownership = buildOwnership(resource, userId, 2);

    const sql = `
      DELETE FROM ${resource.table} t
      WHERE t.${resource.idColumn} = $${idParamIndex} AND ${ownership.clause}
      RETURNING t.*
    `;

    const result = await fastify.pg.query(sql, [id, ...ownership.params]);
    return result.rows[0] ?? null;
  };

  return {
    list,
    getById,
    create,
    update,
    remove,
  };
};
