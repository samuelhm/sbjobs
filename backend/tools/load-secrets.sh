#!/bin/sh
set -e

# Load only backend-required secrets from files as environment variables
for secret_name in DB_PASSWORD JWT_SECRET; do
    secret_file="/run/secrets/${secret_name}.txt"
    if [ ! -f "$secret_file" ]; then
        echo "Missing required secret file: $secret_file" >&2
        exit 1
    fi

    secret_value=$(tr -d '\r' < "$secret_file")
    if [ -z "$secret_value" ]; then
        echo "Secret file is empty: $secret_file" >&2
        exit 1
    fi

    export "$secret_name=$secret_value"
    echo "Loaded required secret: $secret_name"
done