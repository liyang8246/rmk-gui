import type { Config } from 'tailwindcss'
import tailwindScrollbar from 'tailwind-scrollbar'
import PrimeUI from 'tailwindcss-primeui'

export default {
  plugins: [PrimeUI, tailwindScrollbar],
  darkMode: ['class', '.dark-mode'],
  content: [],
  theme: {
    extend: {},
  },
} satisfies Config
