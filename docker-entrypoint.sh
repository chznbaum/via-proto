#!/bin/sh
set -e

if [ "$RUN_MODE" = "worker" ]; then
  echo "Starting worker..."
  exec npx tsx worker.ts
else
  echo "Starting web server..."
  exec node server.js
fi
