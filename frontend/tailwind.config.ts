import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1a1614',
        surface: '#252220',
        border: '#3a3532',
        accent: '#e09f3e',
        primary: '#f5f0eb',
        muted: '#a89f96',
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
        draft: '#fbbf24',
        locked: '#3b82f6',
        reconciling: '#f59e0b',
        reconciled: '#4ade80',
        'chess-king': '#e09f3e',
        'chess-queen': '#a855f7',
        'chess-rook': '#3b82f6',
        'chess-bishop': '#4ade80',
        'chess-knight': '#ef4444',
        'chess-pawn': '#a89f96',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
