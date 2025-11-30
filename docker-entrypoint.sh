#!/bin/sh
set -e

if [ "$RUN_MODE" = "worker" ]; then
  echo "Starting worker..."
  exec npx tsx worker.ts
else
  echo "Running Payload migrations..."
  npx payload migrate || echo "Migration failed or no migrations to run"
  echo "Starting web server..."
  exec node server.js
fi
