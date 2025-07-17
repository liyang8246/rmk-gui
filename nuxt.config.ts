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
  css: ['primeicons/primeicons.css'],
  // Development Config
  future: {
    compatibilityVersion: 4,
  },
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
  // Module Configurations
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
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
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/lodash')) {
              return 'lodash'
            }
            if (id.includes('node_modules/vue')
              || id.includes('node_modules/vue-router')
              || id.includes('node_modules/pinia')) {
              return 'vue'
            }
            if (!id.includes('nuxt/dist')) {
              if (id.includes('components/Aside/')) {
                return 'Aside'
              }
              if (id.includes('components/ConnHID/')) {
                return 'ConnHID'
              }
              if (id.includes('components/KeyMap/')) {
                return 'KeyMap'
              }
              if (id.includes('components/Macros/')) {
                return 'Macros'
              }
            }
          },
        },
      },
    },
  },
})
