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
        border: {
          DEFAULT: '#E5E7EB',
          subtle: '#F3F4F6',
          focus: '#2563EB',
        },
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
          secondary: '#374151',
          tertiary: '#6B7280',
          quaternary: '#9CA3AF',
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
        // Category colors (Timeline / Signals — DS §1.1)
        category: {
          financial:  { DEFAULT: '#10B981', light: '#ECFDF5' },
          leadership: { DEFAULT: '#3B82F6', light: '#EFF6FF' },
          layoffs:    { DEFAULT: '#EF4444', light: '#FEF2F2' },
          hiring:     { DEFAULT: '#8B5CF6', light: '#F5F3FF' },
          legal:      { DEFAULT: '#F97316', light: '#FFF7ED' },
          awards:     { DEFAULT: '#F59E0B', light: '#FFFBEB' },
          growth:     { DEFAULT: '#06B6D4', light: '#ECFEFF' },
          culture:    { DEFAULT: '#EC4899', light: '#FDF2F8' },
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
        // Scarsian micro-scale
        'micro':  ['9px',  { lineHeight: '1.3',  letterSpacing: '0.02em' }],
        // Full DS type scale
        'display-xl': ['48px', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-lg': ['40px', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'title-xl':   ['32px', { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '700' }],
        'title-lg':   ['24px', { lineHeight: '1.25', letterSpacing: '-0.01em',  fontWeight: '700' }],
        'title-md':   ['20px', { lineHeight: '1.3',  letterSpacing: '-0.005em', fontWeight: '600' }],
        'title-sm':   ['16px', { lineHeight: '1.4',  letterSpacing: '0',        fontWeight: '600' }],
        'body-lg':    ['16px', { lineHeight: '1.6',  letterSpacing: '0',        fontWeight: '400' }],
        'body-md':    ['14px', { lineHeight: '1.5',  letterSpacing: '0',        fontWeight: '400' }],
        'body-sm':    ['13px', { lineHeight: '1.5',  letterSpacing: '0',        fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '1.4',  letterSpacing: '0.01em',   fontWeight: '500' }],
        'label':      ['11px', { lineHeight: '1.3',  letterSpacing: '0.08em',   fontWeight: '600' }],
        'badge':      ['11px', { lineHeight: '1.4',  letterSpacing: '0.01em',   fontWeight: '500' }],
        'signal':     ['13px', { lineHeight: '1.55', letterSpacing: '0' }],
        'metric-xl':  ['120px',{ lineHeight: '0.9',  letterSpacing: '-0.04em',  fontWeight: '700' }],
        'metric-lg':  ['48px', { lineHeight: '1.0',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'metric-md':  ['32px', { lineHeight: '1.1',  letterSpacing: '-0.01em',  fontWeight: '700' }],
        'metric-sm':  ['24px', { lineHeight: '1.2',  letterSpacing: '0',        fontWeight: '700' }],
        'nav':        ['14px', { lineHeight: '1.0',  letterSpacing: '0',        fontWeight: '500' }],
        'button':     ['14px', { lineHeight: '1.0',  letterSpacing: '0',        fontWeight: '600' }],
        'button-sm':  ['12px', { lineHeight: '1.0',  letterSpacing: '0',        fontWeight: '600' }],
      },
      letterSpacing: {
        label: '0.08em',
        caps: '0.12em',
        widest2: '0.18em',
      },
      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '14px',
        xl:    '18px',
        '2xl': '22px',
        '3xl': '1.5rem',
        full:  '9999px',
        card:  '22px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        // DS canonical 3-level shadow scale
        sm:  '0 1px 2px rgba(0,0,0,0.04)',
        md:  '0 4px 16px rgba(0,0,0,0.06)',
        lg:  '0 12px 40px rgba(0,0,0,0.10)',
        // Aliases
        card:         '0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.10)',
        modal:        '0 12px 40px rgba(0,0,0,0.10)',
        dropdown:     '0 12px 40px rgba(0,0,0,0.10)',
        glow:         '0 0 40px rgba(37,99,235,0.18), 0 0 80px rgba(37,99,235,0.10)',
        brand:        '0 2px 8px rgba(37,99,235,0.30)',
      },
      transitionDuration: {
        fast:   '100ms',
        base:   '200ms',
        slow:   '300ms',
        slower: '500ms',
      },
      transitionTimingFunction: {
        'ease-default':  'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in':       'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out':      'cubic-bezier(0, 0, 0.2, 1)',
        'ease-spring':   'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // Z-index token system (DS §1.7)
      zIndex: {
        base:      '0',
        elevated:  '10',
        dropdown:  '50',
        modal:     '100',
        command:   '200',
        toast:     '300',
        tooltip:   '400',
      },
      // Named semantic spacing (DS §1.8)
      spacing: {
        card:    '24px',
        section: '48px',
        page:    '24px',
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
