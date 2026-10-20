#!/usr/bin/env bash
# Builds the Suite and the two apps and fills ./gateway
#   bash scripts/build-all.sh                  everything
#   bash scripts/build-all.sh inventory        one part; any of: suite inventory bookings
# Optional environment (set in GitHub Actions, or in scripts/local.env on your computer):
#   INVENTORY_API_URL, BOOKING_API_URL   live backend addresses baked into the two apps
#   SUITE_URL                            with the two above, also writes gateway/config.js
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1   # Git Bash on Windows must not rewrite /inventory/ into a Windows path
[ -f scripts/local.env ] && . scripts/local.env

WHAT=("$@"); [ ${#WHAT[@]} -eq 0 ] && WHAT=(suite inventory bookings)
want() { for w in "${WHAT[@]}"; do [ "$w" = "$1" ] && return 0; done; return 1; }
mkdir -p gateway

install_if_needed() { [ -d "$1/node_modules" ] || (cd "$1" && pnpm install --frozen-lockfile 2>/dev/null || pnpm install); }

# $1 = folder, $2 = base path, $3 = target inside gateway
build_app() {
  local dir="$1" base="$2" target="gateway/$3"
  echo "== $dir (base $base)"
  install_if_needed "$dir"
  (cd "$dir" && APP_BASE="$base" pnpm build)
  grep -q "src=\"${base}assets/" "$dir/dist/index.html" || { echo "The $dir build did not use base $base. Stopping."; exit 1; }
  rm -rf "$target" && mkdir -p "$target"
  cp -r "$dir/dist/." "$target/"
}

if want inventory; then VITE_API_URL="${INVENTORY_API_URL:-${VITE_API_URL:-}}" build_app inventory /inventory/ inventory; fi
if want bookings;  then VITE_API_BASE_URL="${BOOKING_API_URL:-${VITE_API_BASE_URL:-}}" build_app bookings /bookings/ bookings; fi

if want suite; then
  echo "== suite"
  install_if_needed suite
  if [ -n "${SUITE_URL:-}" ] && [ -n "${INVENTORY_API_URL:-}" ] && [ -n "${BOOKING_API_URL:-}" ]; then bash scripts/write-config.sh suite/public/config.js; fi
  (cd suite && pnpm build)
  # replace only the Suite's own files; leave inventory/ and bookings/ alone
  rm -rf gateway/assets gateway/icons gateway/index.html gateway/config.js gateway/sw.js gateway/manifest.webmanifest gateway/serve.json gateway/vercel.json gateway/.htaccess
  cp -r suite/dist/. gateway/
fi

echo
echo "Done. gateway contains: $(ls gateway | tr '\n' ' ')"
echo "Try it:  pnpm serve     Desktop window:  pnpm tauri dev"
