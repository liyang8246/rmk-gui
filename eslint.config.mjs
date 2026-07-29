import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    type: 'app',
    svelte: true,
  },
  {
    ...betterTailwindcss.configs.recommended,
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/assets/css/main.css',
      },
    },
  },
  {
    name: 'ignore-docs',
    ignores: ['docs/**/*', 'src-tauri/**', 'qemu/**', '.slim/**', 'dist/**', 'src/rynk/wasm/**'],
  },
  {
    name: 'global-rule-overrides',
    rules: {
      'antfu/if-newline': 'off',
      'style/brace-style': 'off',
    },
  },
)
