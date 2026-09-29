import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  // Client-only: the rynk transport and its wasm client cannot render on a server.
  ssr: false,
  compatibilityDate: '2026-09-28',
  future: { compatibilityVersion: 5 },
  modules: ['@pinia/nuxt', '@nuxt/eslint', 'reka-ui/nuxt'],
  css: ['~/assets/css/main.css'],
  eslint: { config: { standalone: false } },
  vite: { plugins: [tailwindcss()] },
})
