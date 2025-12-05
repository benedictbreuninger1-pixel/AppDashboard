/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Hinzugefügt
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9f5f9',
          100: '#f0e4f0',
          200: '#e4d0e3',
          300: '#d6b4d5',
          400: '#c898c7',
          500: '#b088b0',
          600: '#956d94',
          700: '#7a5879',
          800: '#5f455e',
          900: '#463446',
        },
      },
    },
  },
  plugins: [],
}