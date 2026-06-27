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
        modal: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        glow: '0 0 40px rgba(59, 91, 255, 0.3)',
      },
      animation: {
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'skeleton': 'skeletonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 40px rgba(59,91,255,0.3), 0 0 80px rgba(59,91,255,0.2), 0 0 120px rgba(59,91,255,0.1)' },
          '50%': { textShadow: '0 0 60px rgba(59,91,255,0.5), 0 0 100px rgba(59,91,255,0.3), 0 0 140px rgba(59,91,255,0.15)' },
        },
        skeletonPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
