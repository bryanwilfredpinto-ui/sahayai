/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Chitti Shares design system
        bg: '#0b0f14',
        surface: '#151b23',
        'surface-2': '#1c242e',
        border: '#273142',
        'border-soft': '#1f2733',
        muted: '#8a96a7',
        text: '#e6edf3',
        accent: '#3b82f6',
        bull: '#22c55e',
        bear: '#ef4444',
        gold: '#f5b942',
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(59,130,246,0.35), 0 8px 32px rgba(59,130,246,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
