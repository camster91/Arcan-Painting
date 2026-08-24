#!/usr/bin/env bash
# deploy-vps.sh — bundle the local source, ship to the host, rebuild the
# arcan-painting-app image, and restart the container.
#
# Mirrors the same pattern as the animal-farts / jw-habits / lull deploy
# recipes: the Mac has no docker, so the image is built on the host
# from a tarball of the source tree (no node_modules / no dist).
#
# Usage:
#   bash scripts/deploy-vps.sh [commit-ish]
#
# Defaults to HEAD. Idempotent.

set -euo pipefail
cd "$(dirname "$0")/.."

SHA="${1:-$(git rev-parse --short HEAD)}"
VPS="${VPS:-hostinger}"
NAME="arcan-app"
PROJECT_DIR="/opt/arcan-painting"
TMP_TARBALL="/tmp/${NAME}.tar.gz"

echo "[deploy] verifying local build (commit ${SHA})…"
if ! git diff --quiet HEAD -- .; then
  echo "[deploy] working tree is dirty — commit or stash first" >&2
  exit 1
fi
git rev-parse "${SHA}" >/dev/null || { echo "[deploy] bad ref: ${SHA}" >&2; exit 1; }
npm run build >/dev/null 2>&1 || {
  echo "[deploy] local build failed — fix before deploying" >&2
  exit 1
}

echo "[deploy] bundling source (no node_modules / no dist)…"
# Archive the requested Git object, not the files checked out in the current
# working directory. This makes rollbacks and revision-specific releases real.
git archive --format=tar "${SHA}" | gzip -c > "${TMP_TARBALL}"

echo "[deploy] uploading to ${VPS}:${PROJECT_DIR}/…"
ssh "${VPS}" "mkdir -p ${PROJECT_DIR}"
cat "${TMP_TARBALL}" | ssh "${VPS}" "cat > ${PROJECT_DIR}/${NAME}.tar.gz"

echo "[deploy] extracting on host…"
ssh "${VPS}" "
  set -e
  cd ${PROJECT_DIR}
  # Back up any existing source we may need (env files, .env, etc.)
  cp -f .env .env.bak 2>/dev/null || true
  # Wipe everything except the backup
  find . -mindepth 1 -maxdepth 1 ! -name '.env.bak' ! -name '${NAME}.tar.gz' -exec rm -rf {} +
  tar -xzf ${NAME}.tar.gz
  # Wipe any stale build/ that may have shipped in the tarball — the
  # Dockerfile's COPY --from=build must not be shadowed by a local
  # build/ directory on the host bind mount.
  rm -rf build/
  # Restore the env
  [ -f .env.bak ] && mv .env.bak .env || true
  rm -f ${NAME}.tar.gz
"

echo "[deploy] rebuilding image…"
ssh "${VPS}" "cd ${PROJECT_DIR} && docker compose build --no-cache 2>&1 | tail -8"

echo "[deploy] swapping container…"
ssh "${VPS}" "cd ${PROJECT_DIR} && docker compose up -d --force-recreate 2>&1 | tail -3"

echo "[deploy] waiting for /api/health…"
healthy=false
for i in {1..30}; do
  if ssh "${VPS}" "cd ${PROJECT_DIR} && docker compose exec -T app wget -q -O - http://127.0.0.1:3000/api/health 2>/dev/null" 2>/dev/null; then
    echo ""
    echo "[deploy] container is healthy"
    healthy=true
    break
  fi
  sleep 1
done

if [ "$healthy" != true ]; then
  echo "[deploy] container did not become healthy after 30 seconds — aborting before proxy sync" >&2
  exit 1
fi

echo "[deploy] syncing Caddyfile (idempotent — skipped if unchanged)…"
bash "$(dirname "$0")/sync-caddy.sh"

echo "[deploy] live check…"
curl -sI -m 10 https://arcanpainting.ca/ 2>&1 | head -3
echo "[deploy] done — verify at https://arcanpainting.ca/"
