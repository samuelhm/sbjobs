#!/bin/sh
set -e

# Load secrets from files as environment variables
. ./tools/load-secrets.sh

# Set PostgreSQL password from secret
export POSTGRES_PASSWORD="$POSTGRES_ADMIN_PASSWORD"

# Create initialization SQL for users and database
. ./tools/init-sql.sh

# Execute the original PostgreSQL entrypoint
exec docker-entrypoint.sh "$@"