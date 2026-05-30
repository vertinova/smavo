#!/bin/bash
# SMAVO auto-deploy script triggered by GitHub webhook.
# Pulls latest main, rebuilds Docker images, ensures Prisma is generated &
# the DB schema is in sync before reporting success.

set -u
LOG_FILE="${LOG_FILE:-/var/log/smavo-webhook.log}"
PROJECT_DIR="${PROJECT_DIR:-/opt/smavo}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-smavo-backend}"
HEALTH_URL="${HEALTH_URL:-http://localhost:4000/api/health}"

stamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log()   { echo "[$(stamp)] [smavo-deploy] $*" | tee -a "$LOG_FILE"; }
run()   { log "▶ $*"; "$@" >> "$LOG_FILE" 2>&1; }

log "🚀 Starting deploy at $PROJECT_DIR"
cd "$PROJECT_DIR" || { log "❌ cd $PROJECT_DIR failed"; exit 1; }

if ! run git pull origin main; then
  log "❌ git pull failed"; exit 1
fi

# Versi build = commit SHA singkat. Dipakai backend (env APP_VERSION) untuk
# memberi tahu client kalau ada deploy baru → tombol "Update Sekarang".
export APP_VERSION="$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
log "🏷  APP_VERSION=$APP_VERSION"

if ! run docker compose build; then
  log "❌ docker compose build failed"; exit 1
fi

if ! run docker compose up -d --remove-orphans; then
  log "❌ docker compose up failed"; exit 1
fi

log "⏳ Waiting for backend health at $HEALTH_URL ..."
for i in $(seq 1 30); do
  if curl -sf "$HEALTH_URL" > /dev/null; then
    log "✅ Backend healthy after ${i} attempts"
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    log "⚠ Backend never reported healthy (continuing anyway)"
  fi
done

log "🧬 npx prisma generate (inside container)..."
docker exec "$BACKEND_CONTAINER" npx prisma generate >> "$LOG_FILE" 2>&1   || log "⚠ prisma generate non-zero exit (continuing)"

log "🗄  npx prisma db push (inside container)..."
docker exec "$BACKEND_CONTAINER" npx prisma db push >> "$LOG_FILE" 2>&1   || log "⚠ prisma db push non-zero exit (continuing)"

log "✅ Deploy completed successfully"
