import type { Config } from 'tailwindcss'

// Minimal config compatible with Tailwind CSS v4
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  // For Tailwind v4, prefer using @plugin in CSS. Keeping plugins empty.
  plugins: [],
}
export default config
