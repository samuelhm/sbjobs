import test from 'node:test';
import assert from 'node:assert/strict';

import { buildApp } from '../src/app.js';

const createInMemoryQueryHandler = () => {
  const users = [];
  const companies = [{ id: 1, name: 'ACME' }];
  let sequence = 1;

  return async (sql, params = []) => {
    if (sql.includes('INSERT INTO users')) {
      const row = {
        id: sequence++,
        email: params[0],
        password_hash: params[1],
        first_name: params[2],
        last_name: params[3],
        phone: params[4],
        avatar: params[5],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.push(row);
      return {
        rows: [
          {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone,
            avatar: row.avatar,
            created_at: row.created_at,
            updated_at: row.updated_at,
          },
        ],
      };
    }

    if (sql.includes('SELECT id, email, password_hash')) {
      const email = String(params[0]).toLowerCase();
      const found = users.find((user) => user.email.toLowerCase() === email);
      return { rows: found ? [found] : [] };
    }

    if (sql.includes('FROM companies t')) {
      return { rows: companies };
    }

    throw new Error(`Unsupported query in test handler: ${sql}`);
  };
};

test('register, login and logout flow with JWT cookie', async () => {
  const app = await buildApp({ queryHandler: createInMemoryQueryHandler() });

  const registerResponse = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'test1@example.com',
      password: 'Password123',
      first_name: 'Ada',
      last_name: 'Lovelace',
    },
  });

  assert.equal(registerResponse.statusCode, 201);

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'test1@example.com',
      password: 'Password123',
    },
  });

  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.cookies.find((cookie) => cookie.name === 'token'));

  const logoutResponse = await app.inject({
    method: 'POST',
    url: '/auth/logout',
    cookies: {
      token: loginResponse.cookies.find((cookie) => cookie.name === 'token').value,
    },
  });

  assert.equal(logoutResponse.statusCode, 204);

  await app.close();
});

test('protected CRUD rejects missing JWT cookie', async () => {
  const app = await buildApp({ queryHandler: createInMemoryQueryHandler() });

  const response = await app.inject({
    method: 'GET',
    url: '/api/companies',
  });

  assert.equal(response.statusCode, 401);

  await app.close();
});
