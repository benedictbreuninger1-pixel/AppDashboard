// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Deine finale Subdomain
const FRONTEND_URL = 'https://app.kingbreuninger.de'; 

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      // Workbox Konfiguration (Caching)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        // Caching für PocketBase Bilder (optional, aber empfohlen für Rezepte)
        runtimeCaching: [
          {
            // Cache alle Dateien von pb.kingbreuninger.de
            urlPattern: ({ url }) => url.hostname === 'pb.kingbreuninger.de',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pb-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Tage
              },
            },
          }
        ]
      },

      // Manifest-Definition: Steuert, wie die App auf dem Handy aussieht
      manifest: {
        name: 'Gemeinsames Dashboard',
        short_name: 'BeneApp',
        description: 'Private Web-App für Todos und Rezepte',
        theme_color: '#4f46e5', // Indigo
        background_color: '#f8fafc', // Slate-50
        display: 'standalone', // Startet ohne Browserleisten
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          // Stellen sicher, dass diese Pfade mit deinen Dateien übereinstimmen
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})