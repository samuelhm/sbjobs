import { existsSync, readFileSync } from 'fs';

function getSecretOrEnv(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  const secretPath = `/run/secrets/${name}.txt`;
  if (existsSync(secretPath)) {
    return readFileSync(secretPath, 'utf8').trim();
  }

  return undefined;
}

function getRequiredValue(name, { fromSecret = false } = {}) {
  const value = fromSecret ? getSecretOrEnv(name) : process.env[name];

  if (!value) {
    throw new Error(`Missing required configuration: ${name}`);
  }

  return value;
}

const config = {
  jwt: {
    secret: getRequiredValue('JWT_SECRET', { fromSecret: true }),
    expiresIn: '24h'
  },
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'production'
  },
  database: {
    host: getRequiredValue('DB_HOST'),
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: getRequiredValue('DB_NAME'),
    user: getRequiredValue('DB_USER'),
    password: getRequiredValue('DB_PASSWORD', { fromSecret: true })
  }
};

export { config };