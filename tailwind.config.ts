import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        surface: "var(--surface)",
        border: "var(--border)",
        taupe: "var(--taupe)",
        ink: "var(--ink)",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", '"Playfair Display"', "serif"],
        inter: ["var(--font-inter)", '"Inter"', "sans-serif"],
        noto: ["var(--font-noto)", '"Noto Sans TC"', "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.15em",
        wide: "0.25em",
      },
    },
  },
  plugins: [],
};
export default config;
