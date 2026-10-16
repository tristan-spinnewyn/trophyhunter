#!/bin/sh
set -e

mkdir -p /app/data /app/.data
chown -R nextjs:nodejs /app/data /app/.data 2>/dev/null || true
chmod 700 /app/data /app/.data 2>/dev/null || true
find /app/data /app/.data -type f -exec chmod 600 {} + 2>/dev/null || true

if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs "$@"
else
  exec "$@"
fi
