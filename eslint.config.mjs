import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    type: 'app',
    vue: true,
  },
  {
    ...betterTailwindcss.configs.recommended,
    files: ['**/*.{tsx,ts,jsx,js,vue}'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/assets/css/main.css',
      },
    },
  },
  {
    name: 'disable-pnpm-workspace-lint',
    files: ['pnpm-workspace.yaml'],
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  },
  {
    name: 'ignore-generated-wasm',
    ignores: ['app/rynk/wasm/**'],
  },
  {
    name: 'ignore-docs',
    ignores: ['docs/**/*'],
  },
  {
    rules: {
      'antfu/if-newline': 'off',
      'style/brace-style': 'off',
    },
  },
)
