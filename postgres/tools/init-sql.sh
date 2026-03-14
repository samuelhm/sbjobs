#!/bin/sh
# Create initialization SQL for users and database

case "$POSTGRES_BACKEND_USER" in
    ''|*[!a-zA-Z0-9_]*)
        echo "POSTGRES_BACKEND_USER must contain only [a-zA-Z0-9_]" >&2
        exit 1
        ;;
esac

case "$POSTGRES_DB" in
    ''|*[!a-zA-Z0-9_]*)
        echo "POSTGRES_DB must contain only [a-zA-Z0-9_]" >&2
        exit 1
        ;;
esac

ESCAPED_DB_PASSWORD=$(printf '%s' "$DB_PASSWORD" | sed "s/'/''/g")

cat > /docker-entrypoint-initdb.d/01-init.sql << EOF
-- Create backend user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_BACKEND_USER}') THEN
                CREATE USER ${POSTGRES_BACKEND_USER} WITH PASSWORD '${ESCAPED_DB_PASSWORD}';
    END IF;
END
\$\$;

-- Grant privileges to backend user on the database
GRANT CONNECT, TEMPORARY ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_BACKEND_USER};

-- Connect to the database to grant schema privileges
\c ${POSTGRES_DB}

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO ${POSTGRES_BACKEND_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${POSTGRES_BACKEND_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_BACKEND_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_BACKEND_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_BACKEND_USER};
EOF