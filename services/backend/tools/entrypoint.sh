#!/bin/sh
set -eu

if [ -n "${DB_PASSWORD_FILE:-}" ]; then
  if [ ! -f "${DB_PASSWORD_FILE}" ]; then
    echo "DB_PASSWORD_FILE does not exist: ${DB_PASSWORD_FILE}" >&2
    exit 1
  fi
  export DB_PASSWORD="$(cat "${DB_PASSWORD_FILE}")"
fi

if [ -z "${POSTGRES_CONNECTION_STRING:-}" ]; then
  if [ -z "${DB_NAME:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ]; then
    echo "DB_NAME, DB_USER and DB_PASSWORD are required to build POSTGRES_CONNECTION_STRING." >&2
    exit 1
  fi

  DB_HOST_VALUE="${DB_HOST:-postgres}"
  DB_PORT_VALUE="${DB_PORT:-5432}"

  ENCODED_DB_USER="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "${DB_USER}")"
  ENCODED_DB_PASSWORD="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "${DB_PASSWORD}")"
  ENCODED_DB_NAME="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "${DB_NAME}")"
  export POSTGRES_CONNECTION_STRING="postgresql://${ENCODED_DB_USER}:${ENCODED_DB_PASSWORD}@${DB_HOST_VALUE}:${DB_PORT_VALUE}/${ENCODED_DB_NAME}"
fi

if [ -n "${JWT_SECRET_FILE:-}" ]; then
  if [ ! -f "${JWT_SECRET_FILE}" ]; then
    echo "JWT_SECRET_FILE does not exist: ${JWT_SECRET_FILE}" >&2
    exit 1
  fi
  export JWT_SECRET="$(cat "${JWT_SECRET_FILE}")"
fi

if [ -f "/app/tools/run-migrations.sh" ]; then
  /app/tools/run-migrations.sh
fi

exec "$@"
