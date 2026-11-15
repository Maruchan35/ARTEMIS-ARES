/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nasaBlue: '#0B3D91',
        nasaRed: '#FC3D21',
        nasaDark: '#060B14',
        nasaPanel: '#0C1628',
        nasaBorder: '#1E3354',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Cascadia Mono"', '"Consolas"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
