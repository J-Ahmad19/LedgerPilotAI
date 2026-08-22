/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2ff',
          100: '#dfe6ff',
          200: '#c6d0ff',
          300: '#a3b3ff',
          400: '#7e8cff',
          500: '#5a65ff',
          600: '#3d3df7',
          700: '#2e2be3',
          800: '#2626b8',
          900: '#1e1b4b',
          950: '#0a0a2e',
        },
        ledger: {
          blue: '#2563eb',
          'blue-light': '#3b82f6',
          'blue-glow': '#60a5fa',
          emerald: '#059669',
          'emerald-light': '#10b981',
          'emerald-glow': '#34d399',
          violet: '#7c3aed',
          'violet-light': '#8b5cf6',
          amber: '#d97706',
          'amber-light': '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'counter-spin': 'counterSpin 20s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(37, 99, 235, 0.2)' },
          '50%': { borderColor: 'rgba(16, 185, 129, 0.4)' },
        },
        counterSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid-60': '60px 60px',
      },
    },
  },
  plugins: [],
}
