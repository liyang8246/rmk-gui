import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

// Tauri environment variables
const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), solid()],

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Tell vite to ignore watching src-tauri
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
