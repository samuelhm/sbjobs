#!/bin/sh
set -eu

if [ -z "${DB_USER:-}" ]; then
  echo "DB_USER is required"
  exit 1
fi

if [ -z "${DB_USER_PASSWORD_FILE:-}" ] || [ ! -f "${DB_USER_PASSWORD_FILE}" ]; then
  echo "DB_USER_PASSWORD_FILE is missing or invalid"
  exit 1
fi

APP_DB_PASSWORD="$(cat "${DB_USER_PASSWORD_FILE}")"

psql -v ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --set=app_user="${DB_USER}" \
  --set=app_pass="${APP_DB_PASSWORD}" \
  --set=app_db="${POSTGRES_DB}" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_pass')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'app_user')
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_user', :'app_pass')
WHERE EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'app_user')
\gexec

GRANT CONNECT ON DATABASE :"app_db" TO :"app_user";
GRANT ALL PRIVILEGES ON DATABASE :"app_db" TO :"app_user";

\connect :"app_db"
GRANT USAGE, CREATE ON SCHEMA public TO :"app_user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO :"app_user";
EOSQL
