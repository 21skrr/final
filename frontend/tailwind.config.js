/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pmi: {
          50: '#f5f7fa',
          100: '#eaeff5',
          200: '#cadded',
          300: '#9abfe0',
          400: '#649bcf',
          500: '#3e7eb9',
          600: '#2b6298',
          700: '#224f7d',
          800: '#002e6d', /* PMI Primary Blue */
          900: '#1c3653',
          950: '#122338',
        },
        primary: {
          DEFAULT: '#002e6d',
          hover: '#224f7d',
          light: '#e0ebf5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'soft': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'inner-light': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)',
      }
    },
  },
  plugins: [],
};
