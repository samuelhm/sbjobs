#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-true}" != "true" ]; then
  echo "Skipping DB migrations (RUN_DB_MIGRATIONS=${RUN_DB_MIGRATIONS:-false})."
  exit 0
fi

if [ -z "${DB_NAME:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ]; then
  echo "DB_NAME, DB_USER and DB_PASSWORD are required to run migrations." >&2
  exit 1
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/tools/migrations}"

if [ ! -d "${MIGRATIONS_DIR}" ]; then
  echo "Migrations directory not found: ${MIGRATIONS_DIR}" >&2
  exit 1
fi

set -- "${MIGRATIONS_DIR}"/*.sql
if [ "$1" = "${MIGRATIONS_DIR}/*.sql" ]; then
  echo "No migration files found in ${MIGRATIONS_DIR}."
  exit 0
fi

export PGPASSWORD="${DB_PASSWORD}"
for migration_file in "$@"; do
  echo "Running migration: ${migration_file}"
  psql \
    "host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} sslmode=disable" \
    -v ON_ERROR_STOP=1 \
    -f "${migration_file}"
done

echo "Database migrations completed successfully."
