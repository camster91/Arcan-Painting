#!/usr/bin/env bash
# sync-caddy.sh — copy the infra/caddy/Caddyfile from the repo to the
# host and reload Caddy. Run this after editing the Caddyfile locally:
#
#   scripts/sync-caddy.sh
#
# The Caddyfile on the host lives at /opt/caddy/Caddyfile. Caddy is
# running as a systemd service. A "reload" via `systemctl reload caddy`
# would be ideal, but the caddy.service doesn't expose the admin API
# on :2019 (it was started without --admin), so reloads fail with
# "dial tcp [::1]:2019: connection refused". The script works around
# that by doing a `systemctl restart caddy` — a few seconds of
# downtime (Caddy restarts in <1s on this host).
#
# CAM does this automatically via the deploy-vps.sh script when the
# repo has an infra/caddy/Caddyfile that differs from the live one.

set -euo pipefail
cd "$(dirname "$0")/.."

VPS="${VPS:-hostinger}"
SRC="$(pwd)/infra/caddy/Caddyfile"
DST="/opt/caddy/Caddyfile"

if [ ! -f "$SRC" ]; then
  echo "[sync-caddy] no infra/caddy/Caddyfile in repo; nothing to sync"
  exit 0
fi

# Diff first — skip the restart if identical
if ssh "$VPS" "cat $DST" | diff -q - "$SRC" >/dev/null 2>&1; then
  echo "[sync-caddy] live Caddyfile matches repo; skipping"
  exit 0
fi

echo "[sync-caddy] copying repo Caddyfile -> $VPS:$DST"
scp "$SRC" "$VPS:$DST" || cat "$SRC" | ssh "$VPS" "cat > $DST"

echo "[sync-caddy] validating on host"
ssh "$VPS" "caddy validate --config $DST --quiet 2>&1 | tail -3" || {
  echo "[sync-caddy] VALIDATION FAILED — not restarting" >&2
  exit 1
}

echo "[sync-caddy] restarting caddy"
ssh "$VPS" "systemctl restart caddy 2>&1"
sleep 2
ssh "$VPS" "systemctl is-active caddy" || {
  echo "[sync-caddy] caddy not active after restart — check journal" >&2
  exit 1
}
echo "[sync-caddy] done"
