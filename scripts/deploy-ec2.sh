#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/app
BACKEND_DIR="$APP_DIR/backend"

run_as_ubuntu() {
  sudo -u ubuntu -H "$@"
}

echo "Fetching main in $APP_DIR"
run_as_ubuntu git -C "$APP_DIR" fetch origin main
run_as_ubuntu git -C "$APP_DIR" merge --ff-only origin/main

echo "Installing backend dependencies"
run_as_ubuntu bash -lc "cd '$BACKEND_DIR' && bun install --frozen-lockfile"

echo "Building backend"
run_as_ubuntu bash -lc "cd '$BACKEND_DIR' && bun run build"

echo "Restarting myapp.service"
systemctl restart myapp.service
systemctl is-active --quiet myapp.service
echo "Deployment complete; myapp.service is active"
