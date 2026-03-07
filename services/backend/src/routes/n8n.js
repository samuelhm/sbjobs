import { HttpError } from '../utils/errors.js';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const MAX_LIMIT = 1000;

const genericTableParamsSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['table'],
    properties: {
      table: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
};

const genericListSchema = {
  ...genericTableParamsSchema,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT },
      offset: { type: 'integer', minimum: 0 },
      order_by: { type: 'string', minLength: 1, maxLength: 128 },
      order_dir: { type: 'string', enum: ['asc', 'desc', 'ASC', 'DESC'] },
    },
  },
};

const genericGetByIdSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['table', 'id'],
    properties: {
      table: { type: 'string', minLength: 1, maxLength: 128 },
      id: { type: 'string', minLength: 1, maxLength: 255 },
    },
  },
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      id_column: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
};

const genericInsertSchema = {
  ...genericTableParamsSchema,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['data'],
    properties: {
      data: { type: 'object', minProperties: 1 },
    },
  },
};

const genericUpdateByIdSchema = {
  ...genericGetByIdSchema,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['data'],
    properties: {
      data: { type: 'object', minProperties: 1 },
    },
  },
};

const genericUpdateWithFiltersSchema = {
  ...genericTableParamsSchema,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['data'],
    properties: {
      data: { type: 'object', minProperties: 1 },
      filters: { type: 'object' },
      allow_all: { type: 'boolean' },
    },
  },
};

const assertSqlIdentifier = (name, label) => {
  if (typeof name !== 'string' || !IDENTIFIER_REGEX.test(name)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Invalid ${label}.`);
  }
};

const quoteIdentifier = (name) => `"${name}"`;

const parseQualifiedTable = (tableNameRaw) => {
  const value = String(tableNameRaw ?? '').trim();
  if (!value) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Table name is required.');
  }

  const parts = value.split('.');
  if (parts.length > 2) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid table name format.');
  }

  const schema = parts.length === 2 ? parts[0] : 'public';
  const table = parts.length === 2 ? parts[1] : parts[0];

  assertSqlIdentifier(schema, 'schema name');
  assertSqlIdentifier(table, 'table name');

  return {
    schema,
    table,
    sql: `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`,
  };
};

const getTableMetadata = async (fastify, tableNameRaw) => {
  const tableRef = parseQualifiedTable(tableNameRaw);

  const columnsResult = await fastify.pg.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position
    `,
    [tableRef.schema, tableRef.table],
  );

  if (columnsResult.rows.length === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Table not found.');
  }

  const columns = columnsResult.rows.map((row) => row.column_name);
  const columnSet = new Set(columns);

  return {
    ...tableRef,
    columns,
    columnSet,
  };
};

const ensureKnownColumns = (columns, columnSet, label) => {
  for (const column of columns) {
    assertSqlIdentifier(column, `${label} column`);
    if (!columnSet.has(column)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `Unknown column '${column}'.`);
    }
  }
};

const buildWhereClause = (filters, metadata, initialParamIndex = 1) => {
  const filterEntries = Object.entries(filters ?? {});
  if (filterEntries.length === 0) {
    return {
      clause: 'TRUE',
      params: [],
      count: 0,
    };
  }

  ensureKnownColumns(
    filterEntries.map(([column]) => column),
    metadata.columnSet,
    'filter',
  );

  let paramIndex = initialParamIndex;
  const params = [];
  const parts = [];

  for (const [column, value] of filterEntries) {
    const quoted = quoteIdentifier(column);

    if (value === null) {
      parts.push(`${quoted} IS NULL`);
      continue;
    }

    parts.push(`${quoted} = $${paramIndex}`);
    params.push(value);
    paramIndex += 1;
  }

  return {
    clause: parts.join(' AND '),
    params,
    count: filterEntries.length,
  };
};

const sanitizeDataPayload = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'data must be a valid object.');
  }

  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'No data provided.');
  }

  return Object.fromEntries(entries);
};

const companyCreateSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      website: { type: 'string', maxLength: 500 },
      industry: { type: 'string', maxLength: 255 },
      size_range: { type: 'string', maxLength: 120 },
      country: { type: 'string', maxLength: 120 },
      city: { type: 'string', maxLength: 120 },
    },
  },
};

const jobOfferCreateSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['company_id', 'title'],
    properties: {
      company_id: { type: 'integer', minimum: 1 },
      title: { type: 'string', minLength: 1, maxLength: 255 },
      description: { type: 'string' },
      requirements: { type: 'string' },
      employment_type: { type: 'string', maxLength: 100 },
      modality: { type: 'string', maxLength: 100 },
      location_text: { type: 'string', maxLength: 255 },
      salary_min: { type: 'number' },
      salary_max: { type: 'number' },
      currency: { type: 'string', maxLength: 12 },
      source_url: { type: 'string', maxLength: 2000 },
      external_ref: { type: 'string', maxLength: 255 },
      status: { type: 'string', enum: ['open', 'closed', 'paused'] },
      published_at: { type: 'string', format: 'date-time' },
    },
  },
};

const matchingUsersSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['jobOfferId'],
    properties: {
      jobOfferId: { type: 'integer', minimum: 1 },
    },
  },
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 200 },
    },
  },
};

const notifyUserSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['application_id', 'channel'],
    properties: {
      application_id: { type: 'integer', minimum: 1 },
      channel: { type: 'string', minLength: 1, maxLength: 50 },
      provider: { type: 'string', maxLength: 100 },
      external_message_id: { type: 'string', maxLength: 255 },
      recipient: { type: 'string', maxLength: 320 },
      metadata: { type: 'object' },
      sent_at: { type: 'string', format: 'date-time' },
    },
  },
};

const n8nAuth = async (request) => {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || !process.env.N8N_API_KEY || apiKey !== process.env.N8N_API_KEY) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Invalid API key.');
  }
};

const n8nRoutes = async (fastify) => {
  fastify.addHook('preHandler', n8nAuth);

  fastify.get('/db/:table', { schema: genericListSchema }, async (request) => {
    const metadata = await getTableMetadata(fastify, request.params.table);
    const limit = Number(request.query.limit ?? 100);
    const offset = Number(request.query.offset ?? 0);

    const requestedOrderBy = request.query.order_by;
    const orderBy = requestedOrderBy ? String(requestedOrderBy) : metadata.columns[0];
    ensureKnownColumns([orderBy], metadata.columnSet, 'order');

    const requestedDir = String(request.query.order_dir ?? 'desc').toLowerCase();
    const orderDir = requestedDir === 'asc' ? 'ASC' : 'DESC';

    const sql = `
      SELECT *
      FROM ${metadata.sql}
      ORDER BY ${quoteIdentifier(orderBy)} ${orderDir}
      LIMIT $1
      OFFSET $2
    `;

    const result = await fastify.pg.query(sql, [limit, offset]);
    return { data: result.rows };
  });

  fastify.get('/db/:table/:id', { schema: genericGetByIdSchema }, async (request) => {
    const metadata = await getTableMetadata(fastify, request.params.table);
    const idColumn = String(request.query.id_column ?? 'id');

    ensureKnownColumns([idColumn], metadata.columnSet, 'id');

    const sql = `
      SELECT *
      FROM ${metadata.sql}
      WHERE ${quoteIdentifier(idColumn)} = $1
      LIMIT 1
    `;

    const result = await fastify.pg.query(sql, [request.params.id]);
    if (!result.rows[0]) {
      throw new HttpError(404, 'NOT_FOUND', 'Row not found.');
    }

    return { data: result.rows[0] };
  });

  fastify.post('/db/:table', { schema: genericInsertSchema }, async (request, reply) => {
    const metadata = await getTableMetadata(fastify, request.params.table);
    const cleanData = sanitizeDataPayload(request.body.data);

    const columns = Object.keys(cleanData);
    ensureKnownColumns(columns, metadata.columnSet, 'insert');

    const values = columns.map((column) => cleanData[column]);
    const columnsSql = columns.map((column) => quoteIdentifier(column)).join(', ');
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO ${metadata.sql} (${columnsSql})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await fastify.pg.query(sql, values);
    return reply.code(201).send({ data: result.rows[0] });
  });

  fastify.patch('/db/:table/:id', { schema: genericUpdateByIdSchema }, async (request) => {
    const metadata = await getTableMetadata(fastify, request.params.table);
    const idColumn = String(request.query.id_column ?? 'id');

    ensureKnownColumns([idColumn], metadata.columnSet, 'id');

    const cleanData = sanitizeDataPayload(request.body.data);
    const columns = Object.keys(cleanData);
    ensureKnownColumns(columns, metadata.columnSet, 'update');

    const setSql = columns.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`).join(', ');
    const idParamIndex = columns.length + 1;
    const values = [...columns.map((column) => cleanData[column]), request.params.id];

    const sql = `
      UPDATE ${metadata.sql}
      SET ${setSql}
      WHERE ${quoteIdentifier(idColumn)} = $${idParamIndex}
      RETURNING *
    `;

    const result = await fastify.pg.query(sql, values);
    if (!result.rows[0]) {
      throw new HttpError(404, 'NOT_FOUND', 'Row not found.');
    }

    return { data: result.rows[0] };
  });

  fastify.patch('/db/:table', { schema: genericUpdateWithFiltersSchema }, async (request) => {
    const metadata = await getTableMetadata(fastify, request.params.table);
    const cleanData = sanitizeDataPayload(request.body.data);
    const updateColumns = Object.keys(cleanData);

    ensureKnownColumns(updateColumns, metadata.columnSet, 'update');

    const setValues = updateColumns.map((column) => cleanData[column]);
    const setSql = updateColumns
      .map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)
      .join(', ');

    const where = buildWhereClause(request.body.filters, metadata, setValues.length + 1);
    const allowAll = request.body.allow_all === true;

    if (where.count === 0 && !allowAll) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'filters are required for bulk updates. Set allow_all=true to update all rows.',
      );
    }

    const updateSql = `
      UPDATE ${metadata.sql}
      SET ${setSql}
      WHERE ${where.clause}
      RETURNING *
    `;

    const result = await fastify.pg.query(updateSql, [...setValues, ...where.params]);

    return {
      data: result.rows,
      meta: {
        affected: result.rows.length,
      },
    };
  });

  fastify.post('/companies', { schema: companyCreateSchema }, async (request, reply) => {
    const {
      name,
      website = null,
      industry = null,
      size_range = null,
      country = null,
      city = null,
    } = request.body;

    const result = await fastify.pg.query(
      `
        INSERT INTO companies (name, website, industry, size_range, country, city)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [name, website, industry, size_range, country, city],
    );

    return reply.code(201).send({ data: result.rows[0] });
  });

  fastify.post('/job-offers', { schema: jobOfferCreateSchema }, async (request, reply) => {
    const {
      company_id,
      title,
      description = null,
      requirements = null,
      employment_type = null,
      modality = null,
      location_text = null,
      salary_min = null,
      salary_max = null,
      currency = null,
      source_url = null,
      external_ref = null,
      status = 'open',
      published_at = null,
    } = request.body;

    const result = await fastify.pg.query(
      `
        INSERT INTO job_offers (
          company_id,
          title,
          description,
          requirements,
          employment_type,
          modality,
          location_text,
          salary_min,
          salary_max,
          currency,
          source_url,
          external_ref,
          status,
          published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
      [
        company_id,
        title,
        description,
        requirements,
        employment_type,
        modality,
        location_text,
        salary_min,
        salary_max,
        currency,
        source_url,
        external_ref,
        status,
        published_at,
      ],
    );

    return reply.code(201).send({ data: result.rows[0] });
  });

  fastify.get('/matching-users/:jobOfferId', { schema: matchingUsersSchema }, async (request) => {
    const { jobOfferId } = request.params;
    const limit = Number(request.query.limit ?? 50);

    const offerResult = await fastify.pg.query(
      `
        SELECT id, title, modality, location_text, salary_min, salary_max
        FROM job_offers
        WHERE id = $1
      `,
      [jobOfferId],
    );

    const jobOffer = offerResult.rows[0];
    if (!jobOffer) {
      throw new HttpError(404, 'NOT_FOUND', 'Job offer not found.');
    }

    const usersResult = await fastify.pg.query(
      `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          up.city,
          up.country,
          up.availability,
          up.years_experience,
          up.desired_salary_min,
          up.desired_salary_max,
          (
            CASE
              WHEN $2 = 'remote' THEN 2
              WHEN up.city IS NOT NULL
                   AND $3 IS NOT NULL
                   AND position(lower(up.city) in lower($3)) > 0 THEN 2
              ELSE 0
            END
            + CASE
                WHEN $4 IS NULL OR up.desired_salary_max IS NULL OR up.desired_salary_max >= $4 THEN 1
                ELSE 0
              END
            + CASE
                WHEN $5 IS NULL OR up.desired_salary_min IS NULL OR up.desired_salary_min <= $5 THEN 1
                ELSE 0
              END
          ) AS match_score
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN applications a ON a.user_id = u.id AND a.job_offer_id = $1
        WHERE a.id IS NULL
        ORDER BY match_score DESC, u.id DESC
        LIMIT $6
      `,
      [jobOfferId, jobOffer.modality, jobOffer.location_text, jobOffer.salary_max, jobOffer.salary_min, limit],
    );

    return {
      data: {
        job_offer: jobOffer,
        total: usersResult.rows.length,
        users: usersResult.rows,
      },
    };
  });

  fastify.post('/notify-user', { schema: notifyUserSchema }, async (request, reply) => {
    const {
      application_id,
      channel,
      provider = null,
      external_message_id = null,
      recipient = null,
      metadata = {},
      sent_at = null,
    } = request.body;

    const payload = {
      channel,
      provider,
      external_message_id,
      recipient,
      ...metadata,
    };

    const result = await fastify.pg.query(
      `
        INSERT INTO application_events (application_id, event_type, event_at, actor, payload_json)
        VALUES ($1, 'n8n_notification_sent', COALESCE($2::timestamptz, now()), 'system', $3::jsonb)
        RETURNING *
      `,
      [application_id, sent_at, JSON.stringify(payload)],
    );

    return reply.code(201).send({ data: result.rows[0] });
  });
};

export default n8nRoutes;