import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        college: {
          50: "#f0f4fc",
          100: "#e0eaf8",
          200: "#c7d8f3",
          300: "#a0bfea",
          400: "#719fe0",
          500: "#4b7ed4",
          600: "#3663be",
          700: "#2d4fa0",
          800: "#1e3770",
          900: "#132347",
          950: "#0b152d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
