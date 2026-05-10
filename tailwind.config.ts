import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F4EF",
        surface: "#EDE8E1",
        border: "#DCCFC1",
        taupe: "#B8A898",
        ink: "#222222",
      },
      fontFamily: {
        playfair: ['"Playfair Display"', "serif"],
        inter: ['"Inter"', "sans-serif"],
        noto: ['"Noto Sans TC"', "sans-serif"],
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
