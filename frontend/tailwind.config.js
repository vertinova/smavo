/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d7ff9',
          hover: '#1a6de3',
          light: '#e8f1fe',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#2d7ff9',
          600: '#1a6de3',
          700: '#1558b8',
        },
        accent: {
          DEFAULT: '#e8b931',
          hover: '#d4a520',
          light: '#fef9e7',
        },
        foreground: '#1a1d23',
        muted: '#5f6368',
        surface: '#f5f6f8',
        border: '#e8eaed',
        sidebar: {
          DEFAULT: '#0a0f1e',
          hover: '#141b2d',
          active: '#1a2236',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'modal': '0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
