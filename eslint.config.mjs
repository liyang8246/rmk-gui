import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    ignores: ['CHERRYPICK.md', 'docs/**/*'],
  }),
  {
    name: 'global-rule-overrides',
    rules: {
      'antfu/if-newline': 'off',
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
  },
)
