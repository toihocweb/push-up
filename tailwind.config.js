/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#09090b',
          gray: '#18181b',
          slate: '#27272a',
          primary: '#00f0ff', // Cyan
          secondary: '#ff003c', // Red
          accent: '#fcee0a', // Yellow
          purple: '#bc13fe', // Purple
        }
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
