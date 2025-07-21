#!/bin/sh

set -e

echo "Custom entrypoint script is running!"

# Execute the original Nginx command
exec nginx -g "daemon off;"