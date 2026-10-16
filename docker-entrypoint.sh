#!/bin/sh
set -e

# S'assurer que les dossiers de donnees existent et sont accessibles
mkdir -p /app/data /app/.data
chown -R nextjs:nodejs /app/data /app/.data 2>/dev/null || true
chmod -R 775 /app/data /app/.data 2>/dev/null || true

# Si execute en tant que root, basculer vers l'utilisateur unprivilegie nextjs
if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs "$@"
else
  exec "$@"
fi
