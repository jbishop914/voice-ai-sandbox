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
          '900': '#0a0a0f',
          '800': '#12121a',
          '700': '#1a1a2e',
          '600': '#222240',
          '500': '#2a2a4a',
          '400': '#3a3a5c',
          '300': '#4a4a6a'
        },
        accent: {
          teal: '#00d4aa',
          'teal-dim': '#00a888',
          'teal-glow': 'rgba(0, 212, 170, 0.15)',
          purple: '#7c3aed',
          'purple-dim': '#6025c7',
          'purple-glow': 'rgba(124, 58, 237, 0.15)'
        },
        text: {
          primary: '#e8e8f0',
          secondary: '#9898b0',
          muted: '#6a6a80'
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
