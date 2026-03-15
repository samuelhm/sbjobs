#!/bin/sh
set -e

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"

MIGRATIONS_MODE=${MIGRATIONS_MODE:-up}
AUTO_REBUILD_ON_CHANGE=${AUTO_REBUILD_ON_CHANGE:-true}

case "$MIGRATIONS_MODE" in
    up|rebuild)
        ;;
    *)
        echo "Invalid MIGRATIONS_MODE: $MIGRATIONS_MODE (allowed: up, rebuild)" >&2
        exit 1
        ;;
esac

case "$AUTO_REBUILD_ON_CHANGE" in
    true|false)
        ;;
    *)
        echo "Invalid AUTO_REBUILD_ON_CHANGE: $AUTO_REBUILD_ON_CHANGE (allowed: true, false)" >&2
        exit 1
        ;;
esac

reset_public_schema() {
    : "${POSTGRES_BACKEND_USER:?POSTGRES_BACKEND_USER is required when MIGRATIONS_MODE=rebuild}"
    escaped_backend_user=$(printf "%s" "$POSTGRES_BACKEND_USER" | sed "s/'/''/g")

    echo "Recreating public schema before applying migrations..."
    PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<SQL
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO ${escaped_backend_user};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${escaped_backend_user};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${escaped_backend_user};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${escaped_backend_user};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${escaped_backend_user};
SQL
}

ensure_schema_migrations_table() {
    PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL
}

apply_migrations() {
    # Run migrations in alphabetical order.
    if [ ! -d "/app/migrations" ] || [ -z "$(ls -A /app/migrations/*.sql 2>/dev/null)" ]; then
        echo "No migrations to run."
        return 0
    fi

    for migration in /app/migrations/*.sql; do
        filename=$(basename "$migration")
        checksum=$(sha256sum "$migration" | awk '{print $1}')
        escaped_filename=$(printf "%s" "$filename" | sed "s/'/''/g")

        existing_checksum=$(PGPASSWORD="$DB_PASSWORD" psql -tA -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT checksum FROM schema_migrations WHERE filename = '$escaped_filename';")

        if [ -n "$existing_checksum" ]; then
            if [ "$existing_checksum" = "$checksum" ]; then
                echo "Skipping already applied migration: $filename"
                continue
            fi

            echo "Migration checksum mismatch detected for $filename" >&2
            echo "Existing checksum: $existing_checksum" >&2
            echo "Current checksum:  $checksum" >&2
            return 42
        fi

        echo "Applying migration: $filename"
        PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
        PGPASSWORD="$DB_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (filename, checksum) VALUES ('$escaped_filename', '$checksum');"
    done

    echo "All migrations completed!"
    return 0
}

if [ "$MIGRATIONS_MODE" = "rebuild" ]; then
    reset_public_schema
    ensure_schema_migrations_table
    apply_migrations
    exit 0
fi

ensure_schema_migrations_table

status=0
apply_migrations || status=$?

if [ "$status" -eq 0 ]; then
    exit 0
fi

if [ "$status" -eq 42 ] && [ "$AUTO_REBUILD_ON_CHANGE" = "true" ]; then
    echo "AUTO_REBUILD_ON_CHANGE=true: rebuilding schema due to migration change."
    reset_public_schema
    ensure_schema_migrations_table
    apply_migrations
    exit 0
fi

echo "Migration process failed with status $status" >&2
exit "$status"