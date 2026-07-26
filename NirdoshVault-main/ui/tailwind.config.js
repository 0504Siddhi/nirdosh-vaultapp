/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0f172a',
          900: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        saffron: {
          400: '#fbbf24',
          500: '#e4a142',
          600: '#d29135',
        },
        primary: {
          DEFAULT: '#e4a142',
          dark: '#d29135',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
