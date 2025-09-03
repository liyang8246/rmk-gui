import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'RMK-GUI',
      meta: [
        {
          name: 'description',
          content: 'A gui configuration for RMK based on Tauri and Nuxt',
        },
      ],
    },
  },
  css: ['~/assets/main.css'],
  // Development Config
  compatibilityDate: '2025-06-23',
  devtools: { enabled: true },
  ssr: false,
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['@types/w3c-web-hid'],
      },
    },
  },
  imports: {
    dirs: ['types'],
    presets: [
      {
        from: '@tauri-apps/api/core',
        imports: ['invoke'],
      },
      {
        from: 'xz-decompress',
        imports: ['XzReadableStream'],
      },
      {
        from: '@kcf-hub/kle-serial',
        imports: ['deserialize'],
      },
      {
        from: '@kcf-hub/kle-serial/dist/interfaces',
        imports: [
          ['Keyboard', 'KleBoard'],
          ['Key', 'KleKey'],
        ],
      },
    ],
  },
  components: [{
    path: '~/components',
    pathPrefix: false,
  }],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: () => 'app',
        },
      },
    },
  },
  // Module Configurations
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
  ],
  tailwindcss: {
    configPath: 'tailwind.config.ts',
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
      ripple: true,
    },
    autoImport: true,
  },
  icon: {
    clientBundle: {
      scan: true,
    },
  },
  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', name: 'Chinese', file: 'zh.json' },
    ],
  },
})
