// https://nuxt.com/docs/api/configuration/nuxt-config
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  ssr: false,
  devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },

  imports: {
    presets: [
      process.env.WASM_BACKEND
        ? { from: 'rmk-gui-web-backend', imports: ['invoke'] }
        : {
            from: '@tauri-apps/api/core',
            imports: ['invoke'],
          },
    ],
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  typescript: {
    typeCheck: true,
  },

  vite: {
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
    },
    plugins: [wasm(), topLevelAwait()],
  },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
});
