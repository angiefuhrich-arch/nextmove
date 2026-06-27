import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Scarsian Design System
        navy: {
          DEFAULT: '#0B1D3A',
          dark: '#070F1E',
          light: '#1E3A66',
          darker: '#050D18',
        },
        blue: {
          DEFAULT: '#3B5BFF',
          hover: '#5468FF',
        },
        verdict: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        score: {
          soft: '#4ADE80',
          light: '#22C55E',
          deep: '#16A34A',
          amber: '#F59E0B',
          red: '#EF4444',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        card: '20px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        modal: '0 24px 64px rgba(0, 8, 20, 0.60)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        glow: '0 0 40px rgba(59, 91, 255, 0.30), 0 0 80px rgba(59, 91, 255, 0.20), 0 0 120px rgba(59, 91, 255, 0.10)',
        dropdown: '0 16px 48px rgba(0, 8, 20, 0.50)',
      },
      animation: {
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'skeleton': 'skeletonPulse 1.5s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
        'spin-slow': 'spinSlow 1s linear infinite',
        'caret-blink': 'caretBlink 1.25s ease-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 40px rgba(59,91,255,0.24), 0 0 80px rgba(59,91,255,0.16), 0 0 120px rgba(59,91,255,0.08), 0 4px 8px rgba(0,0,0,0.30)' },
          '50%': { textShadow: '0 0 40px rgba(59,91,255,0.36), 0 0 80px rgba(59,91,255,0.24), 0 0 120px rgba(59,91,255,0.12), 0 4px 8px rgba(0,0,0,0.30)' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        caretBlink: {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
