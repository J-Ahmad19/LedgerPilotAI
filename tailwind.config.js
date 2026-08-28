/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charm: {
          surface: '#F7F7F5',
          panel: '#FBFAF9',
          band: '#F1F2EA',
          brand: '#E4544B',
          'brand-text': '#C9443A',
          heading: '#1C1917',
          body: '#57534E',
          muted: '#79716B',
          border: '#E7E6E5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Circular', 'DM Sans', 'sans-serif'],
        mono: ['Fragment Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'control': '0 1px 2px rgba(28, 25, 23, 0.05), 0 2px 4px rgba(28, 25, 23, 0.05)',
        'card': '0 2px 8px rgba(28, 25, 23, 0.04), 0 8px 24px rgba(28, 25, 23, 0.04)',
        'float': '0 8px 32px rgba(28, 25, 23, 0.08), 0 24px 64px rgba(28, 25, 23, 0.08)',
        'brand': '0 4px 16px rgba(228, 84, 75, 0.2), 0 8px 32px rgba(228, 84, 75, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #E4544B, #C9443A)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
