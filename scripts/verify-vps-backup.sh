#!/usr/bin/env bash
set -euo pipefail
VPS="${VPS:-hostinger}"
BACKUP_DIR="${BACKUP_DIR:-/opt/arcan-backups}"
backup="${1:-}"
if [ -z "$backup" ]; then
  backup="$(ssh "$VPS" "find '$BACKUP_DIR' -maxdepth 1 -name '*.dump' -type f -printf '%f\n' | sort | tail -1")"
fi
[[ "$backup" =~ ^[A-Za-z0-9._-]+\.dump$ ]] || { echo "Invalid backup filename" >&2; exit 1; }
ssh "$VPS" "bash -s" -- "$BACKUP_DIR/$backup" <<'REMOTE_VERIFY'
set -euo pipefail
backup="$1"
test -s "$backup"
cd /opt/arcan-painting
set -a; . ./.env; set +a
docker compose exec -T db pg_restore -l < "$backup" >/dev/null
sha256sum "$backup"
REMOTE_VERIFY
