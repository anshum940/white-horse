import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/white-horse/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'white-horse.svg',
        'templates/White_Horse_Standard_TB_Import.xlsx',
        'templates/White_Horse_Standard_TB_Import.csv',
        'samples/Sample_Meridian_Manufacturing_TB_FY2025-26.xlsx',
        'samples/Sample_BluePeak_Digital_Services_TB_FY2025-26.xlsx',
        'samples/Sample_GreenTrail_Foods_TB_FY2025-26.xlsx'
      ],
      manifest: {
        name: 'White Horse — Financial Statements Workspace',
        short_name: 'White Horse',
        description: 'Offline-first financial statement preparation, review, and reporting.',
        theme_color: '#102b2a',
        background_color: '#f5f2ea',
        display: 'standalone',
        start_url: '/white-horse/',
        scope: '/white-horse/',
        icons: [
          {
            src: 'white-horse.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/white-horse/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
