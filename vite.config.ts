/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app never registers the service worker on its own -- the portal
      // header has an explicit "offline mode" button (see useOfflineMode)
      // that calls registerSW() itself, so nobody's data plan is spent
      // downloading the whole precache without asking first.
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sanaattori',
        short_name: 'Sanaattori',
        description: 'Suomenkielisten sanapelien portaali',
        theme_color: '#1b2a41',
        background_color: '#1b2a41',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Every game route is a client-side path (BrowserRouter, no per-page
        // HTML), so a reload of e.g. /sanajahti while offline must still
        // resolve to the app shell -- this mirrors the mod_rewrite fallback
        // in public/.htaccess, just for when there's no server to ask.
        navigateFallback: '/index.html',
        // All game code and puzzle/word data ship as hashed JS/JSON chunks
        // in the normal Vite build output, so globbing dist covers every
        // game automatically -- no per-game precache list to maintain.
        globPatterns: ['**/*.{js,css,html,json,svg,woff2,ico,png,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
})
