#!/bin/sh
set -eu

if [ -n "${DB_PASSWORD_FILE:-}" ]; then
  if [ ! -f "${DB_PASSWORD_FILE}" ]; then
    echo "DB_PASSWORD_FILE does not exist: ${DB_PASSWORD_FILE}" >&2
    exit 1
  fi
  export DB_PASSWORD="$(cat "${DB_PASSWORD_FILE}")"
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
