export default defineNuxtConfig({
  // Client-only: the rynk transport and its wasm client cannot render on a server.
  ssr: false,
  compatibilityDate: '2026-09-28',
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  eslint: { config: { standalone: false } },
})
