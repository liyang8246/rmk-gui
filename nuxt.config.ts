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
      {
        from: process.env.WASM_BACKEND === undefined ? '@tauri-apps/api/core' : 'rmk-gui-web-backend',
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

  css: ['~/assets/main.css'],
  tailwindcss: {
    cssPath: '~/assets/main.css',
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  colorMode: {
    classSuffix: '',
  },

  vite: {
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      strictPort: true,
    },
    plugins: process.env.WASM_BACKEND === undefined ? [] : [wasm(), topLevelAwait()],
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode', '@pinia/nuxt', 'shadcn-nuxt', '@nuxt/icon'],
});
