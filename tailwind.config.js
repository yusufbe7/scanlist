/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D8348',
          dark: '#145A32',
          light: '#E8F8EF'
        },
        surface: {
          DEFAULT: '#F7FAF8',
          dark: '#152019'
        },
        ink: {
          DEFAULT: '#10241C',
          dark: '#EAF3EE'
        },
        muted: {
          DEFAULT: '#5B6B63',
          dark: '#8CA398'
        },
        danger: {
          DEFAULT: '#C0392B',
          light: '#FBEAE8'
        },
        border: {
          DEFAULT: '#DCEAE1',
          dark: '#233B2D'
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        scan: '0 6px 16px rgba(29,131,72,0.28)'
      },
      keyframes: {
        laser: {
          '0%,100%': { top: '6%' },
          '50%': { top: '90%' }
        },
        'scan-flash': {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '0' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        laser: 'laser 1.6s ease-in-out infinite',
        'scan-flash': 'scan-flash 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.2s ease-out'
      }
    }
  },
  plugins: []
}
