import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  formatters: true,
  prettierOptions: {
    plugins: ['prettier-plugin-tailwindcss'],
  },
})
