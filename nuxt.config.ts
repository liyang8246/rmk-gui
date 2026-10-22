import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  // Client-only: the rynk transport and its wasm client cannot render on a server.
  ssr: false,
  compatibilityDate: '2026-09-28',
  future: { compatibilityVersion: 5 },
  modules: ['@pinia/nuxt', '@nuxt/eslint', 'reka-ui/nuxt', '@nuxt/icon', '@nuxtjs/color-mode'],
  // Bundle icons at build time: the Tauri app has no network to reach the Iconify API.
  icon: { clientBundle: { scan: true } },
  css: ['~/assets/css/main.css'],
  eslint: { config: { standalone: false } },
  vite: { plugins: [tailwindcss()] },
})
