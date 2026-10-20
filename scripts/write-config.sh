#!/usr/bin/env bash
# Writes the Suite's config.js from environment values. Usage: bash scripts/write-config.sh <output file>
# Needs SUITE_URL, INVENTORY_API_URL, BOOKING_API_URL (the booking one ends in /api/v1).
set -euo pipefail
out="${1:?output file}"
cat > "$out" <<JS
// Written by scripts/write-config.sh. No slash at the end of any address.
window.SUITE_CONFIG = {
  url: '${SUITE_URL:?SUITE_URL is not set}',
  inventoryApi: '${INVENTORY_API_URL:?INVENTORY_API_URL is not set}',
  bookingApi: '${BOOKING_API_URL:?BOOKING_API_URL is not set}',
  localInventoryApi: '${LOCAL_INVENTORY_API_URL:-http://localhost:5000}',
  localBookingApi: '${LOCAL_BOOKING_API_URL:-http://localhost:4000/api/v1}'
};
JS
echo "wrote $out"
