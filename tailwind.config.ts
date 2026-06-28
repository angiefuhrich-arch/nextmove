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
        // Scarsian Design System (light theme v42)
        surface: {
          DEFAULT: '#FAFAFA',
          elevated: '#FFFFFF',
          subdued: '#F3F4F6',
        },
        ink: {
          DEFAULT: '#111827',
          secondary: '#4B5563',
          tertiary: '#9CA3AF',
          quaternary: '#D1D5DB',
        },
        divider: {
          DEFAULT: '#E5E7EB',
          subtle: '#F3F4F6',
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          muted: '#93C5FD',
        },
        // Legacy dark theme (backward compat)
        navy: {
          DEFAULT: '#0B1D3A',
          dark: '#070F1E',
          light: '#1E3A66',
          darker: '#050D18',
        },
        blue: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
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
        // Semantic status colors
        status: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          'success-border': 'rgba(16,185,129,0.30)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245,158,11,0.10)',
          'warning-border': 'rgba(245,158,11,0.30)',
          danger: '#EF4444',
          'danger-bg': 'rgba(239,68,68,0.10)',
          'danger-border': 'rgba(239,68,68,0.30)',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
          'info-border': 'rgba(37,99,235,0.25)',
        },
      },
      fontSize: {
        // Scarsian micro-scale (below Tailwind's xs=12px)
        'micro': ['9px',  { lineHeight: '1.3', letterSpacing: '0.02em' }],
        'label': ['10px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'badge': ['11px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'signal': ['13px', { lineHeight: '1.55' }],
      },
      letterSpacing: {
        label: '0.08em',
        caps: '0.12em',
        widest2: '0.18em',
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
        xs:      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm:      '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        modal:   '0 20px 60px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08)',
        dropdown:'0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        glow:    '0 0 40px rgba(37, 99, 235, 0.18), 0 0 80px rgba(37, 99, 235, 0.10)',
        'brand': '0 2px 8px rgba(37, 99, 235, 0.30)',
      },
      transitionDuration: {
        fast:   '120ms',
        base:   '200ms',
        slow:   '350ms',
        slower: '500ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-expo':  'cubic-bezier(0.7, 0, 0.84, 0)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'glow-pulse':   'glowPulse 4s ease-in-out infinite',
        'skeleton':     'skeletonPulse 1.5s ease-in-out infinite',
        'bounce-slow':  'bounceSlow 2s ease-in-out infinite',
        'spin-slow':    'spinSlow 1s linear infinite',
        'caret-blink':  'caretBlink 1.25s ease-out infinite',
        'pipeline-dot': 'pipelineDot 1.4s ease-in-out infinite',
        'fade-in':      'fadeIn 0.2s ease-out both',
        'slide-up':     'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':   'slideDown 0.2s ease-out both',
        'scale-in':     'scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        pipelineDot: {
          '0%, 80%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
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
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
