import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.png', 'logo.png'],
      manifest: {
        name: 'QuickReview Counter Sale',
        short_name: 'Counter sale',
        description: 'Link standee QR codes to Google profiles at the counter.',
        start_url: '/counter-sale/',
        scope: '/counter-sale/',
        display: 'standalone',
        background_color: '#faf8f5',
        theme_color: '#1a1a1a',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/counter-sale/',
        navigateFallbackDenylist: [/^\/api/, /^\/app/, /^\/admin/, /^\/r\//, /^\/q\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
