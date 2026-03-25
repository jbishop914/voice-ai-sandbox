import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          '900': '#050507',
          '800': '#0a0a0e',
          '700': '#111116',
          '600': '#1a1a20',
          '500': '#24242c',
          '400': '#32323c',
          '300': '#44444f'
        },
        accent: {
          amber: '#f5a623',
          'amber-dim': '#d48f1c',
          'amber-glow': 'rgba(245, 166, 35, 0.15)',
          orange: '#e8742a',
          'orange-dim': '#c46022',
          'orange-glow': 'rgba(232, 116, 42, 0.15)',
          red: '#d44030',
          'red-dim': '#b83528',
          'red-glow': 'rgba(212, 64, 48, 0.15)',
          warm: '#f0c040'
        },
        text: {
          primary: '#f0f0f2',
          secondary: '#9898a0',
          muted: '#606068'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bar-bounce': 'barBounce 1.2s ease-in-out infinite'
      },
      keyframes: {
        barBounce: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' }
        }
      }
    }
  },
  plugins: []
}
