/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#191a18',
        paper: '#f5f3ee',
        olive: '#74745a',
        clay: '#c3a68a',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        editorial: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
