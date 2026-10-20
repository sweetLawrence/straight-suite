# Straight Suite (workspace)

One repo for the frontends only. The backends stay in their own repos.

```
suite/        the launcher (sign-in + Bookings/Inventory switcher) and the Windows app (src-tauri)
inventory/    the inventory frontend
bookings/     the booking admin frontend
scripts/      build-all.sh builds all three into gateway/
.github/workflows/
  deploy.yml  push to main: build everything, keep gateway as a download, publish to Vercel (and cPanel when switched on)
  release.yml publish a GitHub release (tag v0.2.0, ...): build and publish the Windows installer + updater files
gateway/      the finished website. Built by the script, never committed.
```

## First time on your computer
1. Copy your two frontends into `inventory/` and `bookings/` (the contents of each frontend folder; leave out node_modules, dist and .env).
2. `pnpm gateway`  (builds the Suite and both apps into gateway/; installs packages on the first run)
3. Start both backends, then `pnpm serve` and open http://localhost:5170
4. Desktop window: in another window run `pnpm tauri dev` (the first Rust build takes a few minutes)

Rebuild one part: `pnpm gateway inventory`, `pnpm gateway bookings`, `pnpm gateway suite`.
Each app also still runs alone while you work on it: `cd inventory` then `pnpm dev`.

## GitHub setup (once)
Settings, Secrets and variables, Actions.
- Variables: `SUITE_URL` (the website address), `INVENTORY_API_URL`, `BOOKING_API_URL` (ends in /api/v1)
- Vercel (optional): secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Windows releases: secrets `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`
- cPanel website (later): variable `DEPLOY_CPANEL` = true, optional `CPANEL_DIR`, plus the three FTP secrets

Without the Vercel secrets, every push still builds and you download the finished website from the run page (artifact "gateway").

## Notes
- CORS: both backends must allow the website address (and http://localhost:5170 for testing).
- The Windows app stores SUITE_URL inside itself, so changing the domain later means a new release.
- The Windows app keeps the identifier com.straightgroup.os and the same update address and key, so installed Straight OS copies update into Straight Suite.
