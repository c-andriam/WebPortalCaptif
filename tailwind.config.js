/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0d1117',
          900: '#161b22',
          800: '#21262d',
          700: '#30363d',
          600: '#484f58',
          500: '#656d76',
          400: '#8b949e',
          300: '#b1bac4',
          200: '#c9d1d9',
          100: '#f0f6fc',
          50: '#f6f8fa',
        },
        blue: {
          400: '#58a6ff',
          500: '#1f6feb',
          600: '#1158c7',
        },
        green: {
          400: '#3fb950',
          600: '#238636',
          700: '#1a7f37',
        },
        yellow: {
          400: '#d29922',
          600: '#bf8700',
        },
        red: {
          400: '#f85149',
          500: '#da3633',
          600: '#b62324',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-to-top': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}