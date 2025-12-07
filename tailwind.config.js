/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#0b0c15',
        'star-white': '#e2e2e2',
        'hud-blue': '#5bc0de',
        'warning-red': '#d9534f',
      },
    },
  },
  plugins: [],
};
