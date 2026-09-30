import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    ignores: ['CHERRYPICK.md', 'docs/**/*'],
  }),
  {
    ...betterTailwindcss.configs.recommended,
    name: 'better-tailwindcss',
    settings: {
      'better-tailwindcss': { entryPoint: 'app/assets/css/main.css' },
    },
  },
  {
    name: 'global-rule-overrides',
    rules: {
      'antfu/if-newline': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': ['warn', {
        preferSingleLine: true,
        printWidth: 100,
      }],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
  },
)
