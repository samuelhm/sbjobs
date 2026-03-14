#!/bin/sh
# Load secrets from files as environment variables
for secret_file in /run/secrets/*.txt; do
    if [ -f "$secret_file" ]; then
        secret_name=$(basename "$secret_file" .txt)
        secret_value=$(tr -d '\r' < "$secret_file")
        export "$secret_name=$secret_value"
        echo "Loaded secret: $secret_name"
    fi
done

for required_secret in POSTGRES_ADMIN_PASSWORD DB_PASSWORD; do
    if [ -z "$(eval "printf '%s' \"\${$required_secret}\"")" ]; then
        echo "Missing required secret: $required_secret" >&2
        exit 1
    fi
done

echo "Required Postgres secrets loaded."