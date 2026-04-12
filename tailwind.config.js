/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf8f7",
          100: "#d2f0eb",
          200: "#a8e2d8",
          300: "#7bd2c3",
          400: "#4bbdae",
          500: "#2b9d8f",
          600: "#237f74",
          700: "#1f655d",
          800: "#1d514c",
          900: "#1b4440",
        },
      },
    },
  },
  plugins: [],
};

