import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          sidebar: '#121212',
          main: '#1a1a1a',
          received: '#2D2D2D',
          sentBlue: '#3182CE',
          sentTeal: '#005C4B',
          primary: '#E2E8F0',
          muted: '#A0AEC0',
          border: '#1f2937',
        },
      },
    },
  },
  plugins: [],
}

export default config
