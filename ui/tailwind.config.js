/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a1a',
        'bg-secondary': '#2a2a2a',
        'bg-tertiary': '#333333',
        'text-primary': '#e0e0e0',
        'text-secondary': '#b3b3b3',
        'border-color': '#444444',
        'accent-primary': '#4a90e2',
        'accent-secondary': '#50e3c2',
        'accent-danger': '#e57373',
        'accent-client': '#f2994a',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
