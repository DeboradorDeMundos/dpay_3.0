/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        secondary: '#5f6368',
        success: '#34a853',
        danger: '#ea4335',
        warning: '#fbbc04',
        info: '#4285f4',
      },
    },
  },
  plugins: [],
};
