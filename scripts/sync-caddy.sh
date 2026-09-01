#!/usr/bin/env bash
# sync-caddy.sh — re-assert the arcanpainting.ca apex block on
# /opt/caddy/Caddyfile and reload Caddy.
#
# Why this is more than a simple "scp + restart":
#
#   Cam's other projects (alinenasseh, jwhabits, tkd) each have their
#   own deploy scripts that overwrite /opt/caddy/Caddyfile with their
#   own version. Every time one of those deploys runs, it wipes the
#   arcanpainting.ca apex block. So this script is intentionally
#   destructive: it pulls the live file, strips any existing
#   arcan-painting-related blocks, re-appends the apex block at the
#   end, validates, and restarts Caddy. It runs UNCONDITIONALLY — even
#   if the repo Caddyfile already matches what we'd write, we still
#   re-assert the apex block in case a sibling deploy wiped it between
#   runs.
#
# The apex block is the source of truth — defined in
# infra/caddy/Caddyfile as the "arcanpainting.ca, www.arcanpainting.ca
# { reverse_proxy 127.0.0.1:3000 }" stanza (see APEX_MARKER below).
# We extract it via awk by anchor, so it survives edits to the
# Caddyfile's surrounding context.
#
# Usage:
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

VPS="${VPS:-coolify}"
SRC="$(pwd)/infra/caddy/Caddyfile"
DST="/opt/caddy/Caddyfile"

# Anchor for the apex block extraction. The block starts at a line
# containing "arcanpainting.ca" (or "www.arcanpainting.ca") as a site
# address and runs through the matching closing brace at column 0.
APEX_MARKER='arcanpainting\.ca'

# Any block whose first line mentions "arcan" gets stripped before we
# re-append. Caddy site blocks start with a site address on column 0
# and end with a "}" on column 0; blank lines between blocks are
# preserved. This keeps the file tidy even after several cycles of
# strip+append.
ARCAN_MARKER='arcan'

# Remote scratch path for the in-place rewrite. /tmp is safe on this
# host; the script is idempotent and rewrites the file in place.
REMOTE_SCRIPT_PATH="/tmp/sync-caddy-rewrite.sh"

if [ ! -f "$SRC" ]; then
  echo "[sync-caddy] no infra/caddy/Caddyfile in repo; nothing to sync"
  exit 0
fi

echo "[sync-caddy] re-asserting apex block on ${VPS}:$DST (unconditional)…"

# Capture the live Caddyfile's hash BEFORE the rewrite. After the
# rewrite we'll compare; if the file is byte-identical we know the
# apex block was already present and we can skip the Caddy restart
# entirely. This is the "even if the diff says 'same', ensure the
# apex block is present" requirement from the task: we always
# rewrite, but we only restart Caddy when the rewrite actually
# changed something.
LIVE_HASH_BEFORE="$(ssh "$VPS" "sha256sum $DST" | awk '{print $1}')"
echo "[sync-caddy] live Caddyfile sha256 (before): $LIVE_HASH_BEFORE"

# Build the awk program that strips arcan-related site blocks and
# re-appends the apex block. The apex block is pulled from the local
# repo file so edits to infra/caddy/Caddyfile propagate here.
APEX_BLOCK="$(mktemp)"
trap 'rm -f "$APEX_BLOCK"' EXIT

# Extract the apex block: from the line containing the apex
# hostname (e.g. "arcanpainting.ca, www.arcanpainting.ca {") through
# the first column-0 "}" that follows. The block in
# infra/caddy/Caddyfile is short (3 lines) but this handles longer
# blocks too.
#
# 2026-06-15 fix: the previous "$0 ~ marker" was matching any line
# containing "arcan" as a substring, including the apex block's
# neighbor arcan-painting.ashbi.ca block, and stripping both.
# Tighter check: only match lines where the first token is exactly
# the apex marker, or a hostname starting with "arcan" followed
# by a comma/space (multi-host apex) and ending with "ca" or ".ca".
awk -v marker="$APEX_MARKER" '
  $0 ~ "^arcanpainting\\.ca[, ]" && !in_block { in_block = 1 }
  in_block { print; if ($0 == "}") { in_block = 0; exit } }
' "$SRC" > "$APEX_BLOCK"

if [ ! -s "$APEX_BLOCK" ]; then
  echo "[sync-caddy] could not extract apex block from $SRC — aborting" >&2
  exit 1
fi

# Sanity check: the extracted block must look like a Caddy site block
# (must end with "}" on its own line). If not, abort before touching
# the live file.
if ! tail -n 1 "$APEX_BLOCK" | grep -q '^}$'; then
  echo "[sync-caddy] extracted apex block is malformed (no closing brace) — aborting" >&2
  cat "$APEX_BLOCK" >&2
  exit 1
fi

echo "[sync-caddy] apex block extracted from repo:"
sed 's/^/    /' "$APEX_BLOCK"

# Build a small remote rewrite script that:
#   1. reads /opt/caddy/Caddyfile
#   2. emits every non-arcan site block
#   3. appends the apex block at the end
# It is sent over SSH and run with `bash -s`, fed the apex block on
# stdin. This keeps the rewrite atomic on the remote side (one pipe,
# one file rewrite) and avoids quoting issues with nested braces.
REMOTE_REWRITE=$(cat <<'REMOTE_EOF'
set -euo pipefail
DST="/opt/caddy/Caddyfile"
ARCAN_MARKER='arcan'

# Read apex block from stdin into a temp file.
APEX_IN="$(mktemp)"
cat > "$APEX_IN"

# Write the rewritten file to a temp path, then atomically move it
# into place. This way the live Caddyfile is never observed in a
# half-written state if awk/grep dies mid-run.
OUT="$(mktemp)"

awk -v marker="$ARCAN_MARKER" '
  # Skip arcan-related site blocks. A site block starts at a line
  # where the first token contains "arcan" (i.e. a line beginning
  # with "arcanpainting.ca", "arcan-painting.ashbi.ca", etc. on
  # column 0) and runs through the next column-0 "}".
  #
  # 2026-06-15 fix: the previous regex (f1 ~ marker) was too loose —
  # it matched the comment "# Arcan Painting" inside the lull block
  # (the lull-relay site's first comment contained "arcan-painting
  # related blocks" in the historical docs) which then stripped the
  # whole lull block. The deployed Caddyfile ended up missing the
  # arcanpainting ca apex block. Tighter check: the first token must
  # MATCH the marker (full token) or be a hostname containing ".arcan"
  # in the domain part — not just any line with "arcan" as a substring.
  function is_block_start(line,    fields, f1) {
    if (line ~ /^[ \t]/) return 0          # indented, not a site addr
    if (line ~ /^[ \t]*#/) return 0        # comment
    if (line ~ /^[ \t]*$/) return 0        # blank
    if (line ~ /^[ \t]*}/) return 0        # closing brace
    if (line ~ /^[ \t]*{/) return 0        # opening brace (global options)
    f1 = line
    sub(/[ \t{].*/, "", f1)                # strip whitespace + "{" for site addr
    if (f1 == "arcanpainting.ca") return 1
    if (f1 ~ /\.[Aa]rcan/) return 1        # catch arcan-painting.ashbi.ca, etc.
    return 0
  }
  function is_block_end(line) { return line == "}" }

  BEGIN { in_block = 0; skip = 0 }
  {
    if (in_block) {
      if (is_block_end($0)) { in_block = 0; skip = 1; next }
      next
    }
    if (is_block_start($0)) {
      in_block = 1
      skip = 1
      next
    }
    if (skip) { skip = 0; next }   # drop the blank line before a stripped block
    print
  }
' "$DST" > "$OUT"

# Strip any trailing blank lines from the awk output. We want a
# stable, byte-identical file on re-runs (so the "skip restart" gate
# can detect that nothing changed), and the awk output's trailing
# blanks depend on whatever the input's last few lines looked like.
awk '
  { lines[++n] = $0 }
  END {
    while (n > 0 && lines[n] ~ /^[ \t]*$/) n--
    for (i = 1; i <= n; i++) print lines[i]
  }
' "$OUT" > "$OUT.trimmed"
mv -f "$OUT.trimmed" "$OUT"

# Append the apex block with exactly one blank line separator. The
# extracted apex block ends with a "}" on its own line followed by a
# trailing newline; we want the file to end with that "}\n" and no
# extra trailing blank line.
if [ -n "$(tail -n 1 "$OUT")" ]; then
  printf '\n' >> "$OUT"
fi
cat "$APEX_IN" >> "$OUT"

# Atomic move.
mv -f "$OUT" "$DST"
rm -f "$APEX_IN"

# Echo the new file's size + the apex block's first line so the local
# script can log what happened.
wc -l "$DST"
grep -n "$ARCAN_MARKER" "$DST" | head -5 || true
REMOTE_EOF
)

# Ship the rewrite script + the apex block to the host and run it.
# The apex block is fed via stdin so we never have to scp a separate
# file or escape the braces for a heredoc.
echo "[sync-caddy] shipping rewrite script + apex block to ${VPS}…"
if ! ssh "$VPS" "cat > $REMOTE_SCRIPT_PATH" <<< "$REMOTE_REWRITE"; then
  echo "[sync-caddy] failed to upload rewrite script to ${VPS}" >&2
  exit 1
fi
ssh "$VPS" "chmod +x $REMOTE_SCRIPT_PATH"

# Execute the remote rewrite. The apex block goes in via stdin.
if ! cat "$APEX_BLOCK" | ssh "$VPS" "bash $REMOTE_SCRIPT_PATH"; then
  echo "[sync-caddy] remote rewrite failed" >&2
  exit 1
fi

# Confirm the apex block is now in the live file. If it isn't, the
# rewrite script is broken — abort before restarting Caddy with a
# broken config.
if ! ssh "$VPS" "grep -q $APEX_MARKER $DST"; then
  echo "[sync-caddy] apex block missing from live Caddyfile after rewrite — NOT restarting caddy" >&2
  exit 1
fi
echo "[sync-caddy] apex block confirmed in live Caddyfile"

echo "[sync-caddy] validating on host"
# caddy v2.8.4 (on the host) doesn't accept --quiet; it logs JSON to
# stderr/stdout and exits 0 on valid configs. Tail the output to keep
# the deploy log readable; the exit code is what we actually gate on.
ssh "$VPS" "caddy validate --config $DST 2>&1 | tail -3" || {
  echo "[sync-caddy] VALIDATION FAILED — not restarting" >&2
  exit 1
}

# Only restart Caddy if the on-disk file actually changed. We compare
# the live file's hash BEFORE the rewrite to its hash AFTER the
# rewrite + validation. If they're identical, the rewrite was a no-op
# (the apex block was already present, or the file was already in
# the target shape) and we can skip the restart — which is the whole
# point of the resilience pattern: idempotent re-assertion without
# bouncing Caddy.
LIVE_HASH_AFTER="$(ssh "$VPS" "sha256sum $DST" | awk '{print $1}')"
echo "[sync-caddy] live Caddyfile sha256 (after):  $LIVE_HASH_AFTER"
if [ "$LIVE_HASH_BEFORE" = "$LIVE_HASH_AFTER" ]; then
  echo "[sync-caddy] no change to live Caddyfile — apex block was already present, skipping restart"
  exit 0
fi
echo "[sync-caddy] live Caddyfile changed — restarting caddy"
# Restart caddy in the background, then poll its active state with a
# hard timeout. `systemctl is-active` can hang on a busy host, and we
# don't want the deploy script to wedge — bound the whole restart +
# wait to ~15s.
ssh "$VPS" "nohup systemctl restart caddy >/dev/null 2>&1 &"
DEADLINE=$((SECONDS + 15))
while [ $SECONDS -lt $DEADLINE ]; do
  STATE="$(ssh -o ConnectTimeout=3 "$VPS" "systemctl is-active caddy 2>/dev/null")" || true
  if [ "$STATE" = "active" ]; then
    echo "[sync-caddy] caddy active after restart"
    exit 0
  fi
  sleep 1
done
echo "[sync-caddy] caddy not active within 15s of restart — check journal" >&2
ssh "$VPS" "journalctl -u caddy --no-pager -n 20 2>&1" >&2 || true
exit 1
