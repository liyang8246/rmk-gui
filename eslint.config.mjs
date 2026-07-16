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
    rules: {
      'antfu/if-newline': 'off',
    }
  },
)
