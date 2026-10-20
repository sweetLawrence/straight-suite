// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
// import path from 'node:path';

// export default defineConfig({
//   plugins: [
//     TanStackRouterVite({
//       routesDirectory: './src/routes',
//       generatedRouteTree: './src/routeTree.gen.ts',
//     }),
//     react(),
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(process.cwd(), 'src'),
//     },
//   },
//   server: {
//     port: 5173,
//     strictPort: true,
//   },
// });

















import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// Set APP_BASE=/inventory/ to build for Straight Suite; leave empty for the site root
const base = process.env.APP_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      // Each page loads its own code when opened, instead of one big bundle up front
      autoCodeSplitting: true,
    }),
    react(),
    // Installable app: home-screen icon, opens full screen, app shell cached for fast starts.
    // Data still comes live from the API; nothing from the API is cached.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Straight Inventory',
        short_name: 'Straight',
        description: "Orders, bar, stock, cash and reports for Mums' Garden and Centurion",
        lang: 'en',
        start_url: `${base}dashboard`,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#1F3A5F',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Push messages from the server (see public/push-sw.js)
        importScripts: ['push-sw.js'],
        navigateFallback: `${base}index.html`,
        // Never answer API calls from the cache
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely, so browsers keep them cached between deploys
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('@tanstack/')) return 'router';
          if (id.includes('@mantine/') || id.includes('dayjs')) return 'mantine';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
