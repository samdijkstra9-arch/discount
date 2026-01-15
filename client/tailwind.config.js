/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ah-blue': '#00A0E2',
        'ah-dark': '#003DA5',
        'jumbo-yellow': '#FFD500',
        'jumbo-black': '#000000',
      },
    },
  },
  plugins: [],
}
