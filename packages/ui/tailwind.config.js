/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("tailwindcss-animate")],
  theme: {
    extend: {
      borderRadius: {
        lg: `0.5rem`,
        md: `calc(0.5rem - 2px)`,
        sm: 'calc(0.5rem - 4px)',
      },
      colors: {
        accent: 'hsl(240 4.8% 95.9%)',
        'accent-foreground': 'hsl(240 5.9% 10%)',
        background: 'hsl(0 0% 100%)',
        border: 'hsl(240 5.9% 90%)',
        card: 'hsl(0 0% 100%)',
        'card-foreground': 'hsl(240 10% 3.9%)',
        destructive: 'hsl(0 84.2% 60.2%)',
        'destructive-foreground': 'hsl(0 0% 98%)',
        foreground: 'hsl(240 10% 3.9%)',
        input: 'hsl(240 5.9% 90%)',
        muted: 'hsl(240 4.8% 95.9%)',
        'muted-foreground': 'hsl(240 3.8% 46.1%)',
        popover: 'hsl(0 0% 100%)',
        'popover-foreground': 'hsl(240 10% 3.9%)',
        primary: 'hsl(240 5.9% 10%)',
        'primary-foreground': 'hsl(0 0% 98%)',
        ring: 'hsl(240 5.9% 10%)',
        secondary: 'hsl(240 4.8% 95.9%)',
        'secondary-foreground': 'hsl(240 5.9% 10%)',
        dark: {
          accent: 'hsl(240 3.7% 15.9%)',
          'accent-foreground': 'hsl(0 0% 98%)',
          background: 'hsl(240 10% 3.9%)',
          border: 'hsl(240 3.7% 15.9%)',
          card: 'hsl(240 10% 3.9%)',
          'card-foreground': 'hsl(0 0% 98%)',
          destructive: 'hsl(0 62.8% 30.6%)',
          'destructive-foreground': 'hsl(0 0% 98%)',
          foreground: 'hsl(0 0% 98%)',
          input: 'hsl(240 3.7% 15.9%)',
          muted: 'hsl(240 3.7% 15.9%)',
          'muted-foreground': 'hsl(240 5% 64.9%)',
          popover: 'hsl(240 10% 3.9%)',
          'popover-foreground': 'hsl(0 0% 98%)',
          primary: 'hsl(0 0% 98%)',
          'primary-foreground': 'hsl(240 5.9% 10%)',
          ring: 'hsl(240 4.9% 83.9%)',
          secondary: 'hsl(240 3.7% 15.9%)',
          'secondary-foreground': 'hsl(0 0% 98%)',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-to-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-in-out',
        'slide-out-to-left': 'slide-out-to-left 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-in-out',
        'slide-down': 'slide-down 0.3s ease-in-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
}

