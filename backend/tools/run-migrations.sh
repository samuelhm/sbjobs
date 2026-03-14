#!/bin/sh
set -e

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"

# Run migrations in alphabetical order
if [ -d "/app/migrations" ] && [ "$(ls -A /app/migrations/*.sql 2>/dev/null)" ]; then
    for migration in /app/migrations/*.sql; do
        filename=$(basename "$migration")
        echo "Applying migration: $filename"
        PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
    done
    echo "All migrations completed!"
else
    echo "No migrations to run."
fi