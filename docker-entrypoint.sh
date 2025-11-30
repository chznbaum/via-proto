#!/bin/sh
set -e

if [ "$RUN_MODE" = "worker" ]; then
  echo "Starting worker..."
  exec npx tsx worker.ts
else
  echo "Running Payload migrations..."
  npx payload migrate
  echo "Starting web server..."
  exec node server.js
fi
