import type { Config } from "tailwindcss";
import PrimeUI from "tailwindcss-primeui";

export default <Config>{
  plugins: [PrimeUI],
  darkMode: ["class", ".dark-mode"],
  content: [],
  theme: {
    extend: {},
  },
};
