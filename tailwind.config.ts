import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bone: '#FAF7F2',
        shell: '#F1EBE1',
        paper: '#FFFDF9',
        ink: {
          DEFAULT: '#16130F',
          soft: '#2A241C',
        },
        slate: {
          DEFAULT: '#5B5346',
          light: '#8F8778',
          faint: '#A39A8C',
        },
        line: '#E3DACA',
        flame: '#C6431F',
        forest: '#1C5C42',
        ochre: '#9A6413',
        crimson: '#96201A',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '2px',
        md: '4px',
        lg: '6px',
        xl: '6px',
        '2xl': '8px',
      },
      boxShadow: {
        overlay: '0 16px 40px -16px rgba(22, 19, 15, 0.24)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'sheet-up': 'sheet-up 180ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
