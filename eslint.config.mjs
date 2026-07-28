import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu(
    {
      type: 'app',
      vue: true,
    },
    {
      ...betterTailwindcss.configs.recommended,
      settings: {
        'better-tailwindcss': {
          entryPoint: 'app/assets/css/main.css',
        },
      },
    },
  ),
  {
    name: 'ignore-docs',
    ignores: ['docs/**/*'],
  },
  {
    name: 'global-rule-overrides',
    rules: {
      'antfu/if-newline': 'off',
      'style/brace-style': 'off',
    },
  },
)
