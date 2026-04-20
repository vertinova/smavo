/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          hover: 'rgb(var(--card-hover) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-light': 'rgb(var(--border-light) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          muted: 'var(--accent-muted)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          muted: 'var(--warning-muted)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          muted: 'var(--danger-muted)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          muted: 'var(--info-muted)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        modal: 'var(--shadow-modal)',
      },
      borderRadius: { '4xl': '2rem' },
      animation: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        slideUp: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        slideIn: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        pulse2: 'pulse2 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-up-delay-1': 'fadeUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both',
        'fade-up-delay-2': 'fadeUp 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'fade-up-delay-3': 'fadeUp 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'fade-up-delay-4': 'fadeUp 0.7s 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s 2s ease-in-out infinite',
        'float-slow': 'float 8s 1s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slideInLeft 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slideInRight 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'bar-grow': 'barGrow 1.5s 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'donut-draw': 'donutDraw 1.5s 0.8s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulse2: {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceGentle: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        barGrow: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        donutDraw: {
          from: { strokeDasharray: '0 151' },
          to: { strokeDasharray: '108 151' },
        },
      },
    },
  },
  plugins: [],
};
