/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/presentation/components/editor/**/*.vue',
    './src/presentation/components/GmWikiEditor.client.vue',
  ],
  theme: {
    extend: {
      colors: {
        'gm-primary': '#e94560',
        'gm-bg': '#1a1a2e',
        'gm-border': '#0f3460',
        'gm-text': '#e0e0e0',
        'gm-muted': '#a0a0b0',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

