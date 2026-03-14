#!/bin/sh
set -e

# Load secrets from files as environment variables
. ./tools/load-secrets.sh

# Execute the main command
exec "$@"