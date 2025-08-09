#!/bin/sh

set -e

# Log startup information
echo "Starting AgenticForge UI with Nginx..."
echo "Date: $(date)"
echo "User: $(whoami)"

# Set default environment variables if not provided
export ADDITIONAL_CONNECT_SRC="${ADDITIONAL_CONNECT_SRC:-http://localhost:8080}"

echo "Environment variables:"
echo "  ADDITIONAL_CONNECT_SRC=${ADDITIONAL_CONNECT_SRC}"

# Substitute environment variables in nginx configuration
echo "Substituting environment variables in nginx config..."
envsubst '${ADDITIONAL_CONNECT_SRC}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# Validate that the nginx configuration is correct
echo "Validating Nginx configuration..."
nginx -t

# Set proper permissions for the web root
echo "Setting permissions for web root..."
chmod -R 755 /usr/share/nginx/html || echo "Warning: Could not set permissions on web root"

# Execute the original Nginx command
echo "Starting Nginx..."
exec nginx -g "daemon off;"