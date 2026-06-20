import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.svg', 'icons/icon-512.svg'],
        manifest: false,
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: { cacheName: 'supabase-api', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
            },
          ],
        },
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw-push.ts',
        injectManifest: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    // NOTE: GEMINI_API_KEY removed from define — never expose API keys in client bundle.
    // Use backend proxy endpoints to call Gemini instead.
    envPrefix: 'VITE_',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Three.js ecosystem — ~500KB — used only in Background3D (lazy)
            if (id.includes('node_modules/three') ||
                id.includes('@react-three/fiber') ||
                id.includes('@react-three/drei')) {
              return 'vendor-3d';
            }
            // PDF.js — ~480KB — used only in EbookReaderPro (lazy via Member page)
            if (id.includes('node_modules/pdfjs-dist') ||
                id.includes('node_modules/react-pdf')) {
              return 'vendor-pdf';
            }
            // epub.js — ebook reader
            if (id.includes('node_modules/epubjs')) {
              return 'vendor-epub';
            }
            // Core React runtime
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Supabase client
            if (id.includes('node_modules/@supabase/')) {
              return 'vendor-supabase';
            }
            // Animation library
            if (id.includes('node_modules/motion') ||
                id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // i18n stack
            if (id.includes('node_modules/i18next') ||
                id.includes('node_modules/react-i18next')) {
              return 'vendor-i18n';
            }
            // Stripe.js
            if (id.includes('node_modules/@stripe/')) {
              return 'vendor-stripe';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
