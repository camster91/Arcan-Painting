#!/usr/bin/env bash
set -euo pipefail
VPS="${VPS:-hostinger}"
BACKUP_DIR="${BACKUP_DIR:-/opt/arcan-backups}"
backup="${1:-}"
confirmation="${2:-}"
[[ "$backup" =~ ^[A-Za-z0-9._-]+\.dump$ ]] || { echo "Usage: $0 BACKUP.dump 'RESTORE BACKUP.dump'" >&2; exit 1; }
[ "$confirmation" = "RESTORE $backup" ] || { echo "Confirmation must exactly match: RESTORE $backup" >&2; exit 1; }
ssh "$VPS" "bash -s" -- "$BACKUP_DIR/$backup" <<'REMOTE_RESTORE'
set -euo pipefail
backup="$1"; test -s "$backup"
cd /opt/arcan-painting
set -a; . ./.env; set +a
db_user="${POSTGRES_USER:-arcan}"; db_name="${POSTGRES_DB:-arcan_painting}"
pre_restore="/opt/arcan-backups/pre-restore-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T db pg_dump -U "$db_user" -d "$db_name" -Fc > "$pre_restore"
docker compose exec -T db pg_restore -l < "$pre_restore" >/dev/null
docker compose stop app
docker compose exec -T db dropdb -U "$db_user" --if-exists "$db_name"
docker compose exec -T db createdb -U "$db_user" "$db_name"
docker compose exec -T db pg_restore -U "$db_user" -d "$db_name" --no-owner --exit-on-error < "$backup"
docker compose up -d app
REMOTE_RESTORE
echo "Restore completed; run authenticated and public smoke checks before declaring recovery complete."
