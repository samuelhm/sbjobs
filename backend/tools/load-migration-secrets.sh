#!/bin/sh
set -e

secret_file="/run/secrets/POSTGRES_ADMIN_PASSWORD.txt"

if [ ! -f "$secret_file" ]; then
    echo "Missing required secret file: $secret_file" >&2
    exit 1
fi

secret_value=$(tr -d '\r' < "$secret_file")
if [ -z "$secret_value" ]; then
    echo "Secret file is empty: $secret_file" >&2
    exit 1
fi

# Map admin secret to DB_PASSWORD expected by run-migrations.sh.
export "DB_PASSWORD=$secret_value"

echo "Loaded required secret for migrator: POSTGRES_ADMIN_PASSWORD"
