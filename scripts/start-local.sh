#!/usr/bin/env sh
set -eu

ENV_FILE="apps/ai-ticket-classifier/.env"
ENV_EXAMPLE_FILE="apps/ai-ticket-classifier/.env.example"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
  echo "Created $ENV_FILE from $ENV_EXAMPLE_FILE"
fi

docker compose up --build -d

echo "ai-ticket-classifier is starting on http://localhost:3000"
echo "Health check: curl http://localhost:3000/health"
