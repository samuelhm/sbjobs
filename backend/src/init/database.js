import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

let pool = null;

function initDatabase(fastify) {
  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
  });

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
}

function getPool() {
  return pool;
}

export { initDatabase, getPool };