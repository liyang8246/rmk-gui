import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    type: 'app',
    solid: true,
  },
  {
    ...betterTailwindcss.configs.recommended,
    files: ['**/*.{tsx,ts,jsx,js}'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/assets/css/main.css',
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
    ignores: ['src/rynk/wasm/**'],
  },
  {
    // Docs contain illustrative code snippets (shorthand methods, top-level
    // return, single-line loops) that are valid as prose examples but not as
    // standalone programs. SUMMARY.md uses multiple H1 by mdBook convention.
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
