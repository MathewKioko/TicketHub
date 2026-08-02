import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Midnight Luxe Theme Colors
        onyx: '#0A0A0B',
        coal: '#121214',
        ash: '#17171A',
        slateish: '#1E1E22',
        gold: {
          DEFAULT: '#D4AF7A',
          light: '#E8C990',
          pale: '#F3E5CC',
          dark: '#B08D57',
          deepest: '#8C6D3F',
        },
        ivory: '#F5F1E8',
        linen: '#EDE7DB',
        taupe: '#8A8578',
        blush: '#C97F66',
        kenyan: {
          black: '#0A0A0B',
          red: '#C97F66',
          green: '#D4AF7A',
          gold: '#D4AF7A',
          cream: '#EDE7DB',
          dark: '#131316',
          charcoal: '#17171A',
          muted: '#8A8578',
          accent: '#E8C990',
        },
        primary: {
          50: '#FBF7F0',
          100: '#F3E8D3',
          200: '#E8D1A4',
          300: '#DFBE83',
          400: '#D9B474',
          500: '#D4AF7A',
          600: '#B08D57',
          700: '#8C6D3F',
          800: '#6B5130',
          900: '#4D3A23',
          950: '#33261A',
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(212, 175, 122, 0.15)',
        'glow-lg': '0 0 40px rgba(212, 175, 122, 0.25)',
        'glow-xl': '0 0 60px rgba(212, 175, 122, 0.35)',
        'inner-glow': 'inset 0 0 20px rgba(212, 175, 122, 0.06)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.4), 0 10px 20px -2px rgba(0, 0, 0, 0.3)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        'premium': '0 20px 60px -15px rgba(0, 0, 0, 0.6)',
        'premium-lg': '0 25px 80px -20px rgba(0, 0, 0, 0.7)',
        'neon': '0 0 5px rgba(212, 175, 122, 0.4), 0 0 10px rgba(212, 175, 122, 0.25), 0 0 20px rgba(212, 175, 122, 0.15)',
        'float': '0 10px 30px rgba(0, 0, 0, 0.4), 0 1px 8px rgba(0, 0, 0, 0.3)',
        'kenyan-gold': '0 0 20px rgba(212, 175, 122, 0.25)',
        'kenyan-red': '0 0 20px rgba(201, 127, 102, 0.25)',
        'kenyan-green': '0 0 20px rgba(212, 175, 122, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(ellipse at 30% 20%, rgba(212,175,122,0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(201,127,102,0.08) 0%, transparent 50%)',
        'gold-gradient': 'linear-gradient(135deg, #E8C990 0%, #D4AF7A 45%, #B08D57 100%)',
        'luxe-gradient': 'linear-gradient(135deg, #0A0A0B 0%, #131316 50%, #17171A 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'scale-in-bounce': 'scaleInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer': 'shimmer 2s linear infinite',
        'shimmer-slow': 'shimmer 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'gradient-y': 'gradientY 12s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'kenyan-pulse': 'kenyanPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleInBounce: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 122, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 122, 0.4)' },
        },
        gradientX: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        gradientY: {
          '0%, 100%': { 'background-position': '50% 0%' },
          '50%': { 'background-position': '50% 100%' },
        },
        kenyanPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 122, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 122, 0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config

