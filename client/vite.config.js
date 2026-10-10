import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Source maps for Sentry (12.4). Only when SENTRY_AUTH_TOKEN is set at build
// time (Vercel): maps are built hidden, uploaded, then deleted, so they are
// never served. Local builds are unchanged — no maps at all.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    uploadSourceMaps &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
        telemetry: false,
      }),
  ].filter(Boolean),
  build: {
    sourcemap: uploadSourceMaps ? 'hidden' : false,
  },
  server: {
    host: true, // Allows other devices on your Wi-Fi to connect
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target : 'http://localhost:5000' ,
        ws : true,
      }
    },
  },
})
