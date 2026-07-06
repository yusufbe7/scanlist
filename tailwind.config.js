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
        scanFlash: {
          '0%': { opacity: '0', boxShadow: '0 0 0 0 rgba(16,185,129,0.7) inset' },
          '30%': { opacity: '1', boxShadow: '0 0 0 6px rgba(16,185,129,0.55) inset' },
          '100%': { opacity: '0', boxShadow: '0 0 0 0 rgba(16,185,129,0) inset' }
        }
      },
      animation: {
        laser: 'laser 1.8s ease-in-out infinite',
        scanFlash: 'scanFlash 320ms ease-out'
      }
    }
  },
  plugins: []
}