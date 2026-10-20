import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Suite is served at the site root; the two apps live in /inventory/ and /bookings/ beside it.
// In `pnpm dev` those two paths are forwarded to the apps' own dev servers (ports below),
// so the Suite can be tried without building the apps. Change a port with SUITE_INVENTORY_DEV / SUITE_BOOKINGS_DEV.
declare const process: { env: Record<string, string | undefined> }

const inventory = process.env.SUITE_INVENTORY_DEV || 'http://localhost:5171'
const bookings = process.env.SUITE_BOOKINGS_DEV || 'http://localhost:5172'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/inventory': { target: inventory, ws: true, changeOrigin: true },
      '/bookings': { target: bookings, ws: true, changeOrigin: true },
    },
  },
})
