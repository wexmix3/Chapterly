import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee', 100: '#fdedd6', 200: '#fad7ad', 300: '#f6b978',
          400: '#f19341', 500: '#ee7a1e', 600: '#df6113', 700: '#b94912',
          800: '#933b16', 900: '#773315', 950: '#401709',
        },
        ink: {
          50: '#f6f6f6', 100: '#e7e7e7', 200: '#d1d1d1', 300: '#b0b0b0',
          400: '#888888', 500: '#6d6d6d', 600: '#5d5d5d', 700: '#4f4f4f',
          800: '#454545', 900: '#3d3d3d', 950: '#1a1a1a',
        },
        paper: {
          50: '#fdfcfb', 100: '#f9f6f1', 200: '#f3ede2', 300: '#e9dfce',
          400: '#dccdb3', 500: '#cfba9a',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'streak-glow': {
          '0%, 100%': { boxShadow: '0 0 12px 2px rgba(238,122,30,0.4)' },
          '50%': { boxShadow: '0 0 24px 6px rgba(238,122,30,0.6)' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'streak-glow': 'streak-glow 2s ease-in-out infinite',
        'page-enter': 'page-enter 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
