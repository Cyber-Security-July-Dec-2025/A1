#!/usr/bin/env bash
set -euo pipefail

# Project root check
if [ ! -f "docker-compose.yml" ]; then
  echo "Run this script from the project root containing docker-compose.yml" >&2
  exit 1
fi

# Default actions
ACTION=${1:-up}

print_links() {
  echo ""
  echo "Open these in your browser:" 
  echo "  - Frontend: http://localhost:3000"
  echo "  - API health: http://localhost:5001/health"
  echo ""
}

wait_and_open_urls() {
  # Wait for backend health
  echo "Waiting for API health at http://localhost:5001/health ..."
  for i in {1..40}; do
    if curl -fsS http://localhost:5001/health > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done || true

  # Try to open browser tabs (macOS 'open')
  if command -v open >/dev/null 2>&1; then
    open http://localhost:3000 || true
    open http://localhost:5001/health || true
  fi
}

case "$ACTION" in
  up)
    echo "Building and starting containers..."
    print_links
    docker compose up --build
    ;;
  up-detach|up-d)
    echo "Building and starting containers in detached mode..."
    docker compose up -d --build
    print_links
    wait_and_open_urls
    ;;
  down)
    echo "Stopping containers..."
    docker compose down
    ;;
  down-v)
    echo "Stopping containers and removing volumes (DATA LOSS)..."
    docker compose down -v
    ;;
  logs)
    docker compose logs -f
    ;;
  exec-server)
    docker compose exec server sh
    ;;
  exec-client)
    docker compose exec client sh
    ;;
  *)
    echo "Usage: $0 {up|up-detach|up-d|down|down-v|logs|exec-server|exec-client}" >&2
    exit 2
    ;;
esac


