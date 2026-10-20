import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
declare const process: { env: Record<string, string | undefined> }

// Set APP_BASE=/bookings/ to build for Straight Suite; leave empty for the site root
export default defineConfig({
  base: process.env.APP_BASE || '/',
  plugins: [react(),tailwindcss()],
    server: {
    allowedHosts: true,
  },
})

