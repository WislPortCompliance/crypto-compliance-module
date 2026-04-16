import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#d9e4f0',
          200: '#b3c9e1',
          300: '#7aa4c8',
          400: '#4a7faf',
          500: '#2d6496',
          600: '#1e4d7a',
          700: '#163a5f',
          800: '#0f2847',
          900: '#1A2332',
          950: '#0d1928',
        },
        brand: {
          blue: '#2563EB',
          navy: '#1A2332',
        },
        status: {
          compliant: '#16a34a',
          partial: '#d97706',
          noncompliant: '#dc2626',
          notassessed: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
