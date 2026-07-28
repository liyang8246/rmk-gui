import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  ssr: false,
  modules: [
    '@pinia/nuxt',
    'reka-ui/nuxt',
    '@nuxt/icon',
    '@nuxt/hints',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],
  devtools: { enabled: true },
  eslint: {
    config: {
      standalone: false,
    },
  },
  imports: { autoImport: false },
  components: { dirs: [] },
  nitro: { imports: false },
  css: ['~/assets/css/main.css'],
  alias: {
    '~': fileURLToPath(new URL('./app', import.meta.url)),
    '@': fileURLToPath(new URL('./app', import.meta.url)),
  },
  vite: {
    plugins: [tailwindcss()],
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
    },
  },
  devServer: {
    port: 1420,
  },
  ignore: ['**/src-tauri/**', '**/qemu/**'],
})
