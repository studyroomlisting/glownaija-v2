import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use simple names — no DEFAULT suffix issues in @apply
        rose:    '#E8607A',
        'rose-dark': '#C94D66',
        // Text-safe rose for normal-size body text on light backgrounds (contrast ~4.9:1, AA-compliant).
        // Use this instead of `text-rose` when the rose color is being applied to readable text, not
        // large UI surfaces like buttons (those can keep `text-rose`/`bg-rose`, which pass the 3:1
        // large-text/UI-component threshold).
        'rose-text': '#C94D66',
        gold:    '#D4AF37',
        gn:      '#10B981',   // renamed from green to avoid Tailwind green conflict
        ink:     '#1C1008',
        'ink-2': '#3D2B1A',
        'ink-3': '#8C7B6E',
        // Muted text on DARK surfaces (e.g. the footer). `ink-3` was tuned for light backgrounds and
        // only just clears AA contrast on `ink` — use this token for any text sitting on `bg-ink`.
        'ink-3-on-dark': '#B8A99A',
        page:    '#FFF9F5',
        'page-2':'#F5EDE5',
        bdr:     '#E8E0D8',   // renamed from border to avoid Tailwind conflict
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Small-text tokens: replaces scattered `text-[10px]` / `text-[9px]` arbitrary values
        // found across Header, cards, Tabs, admin rows, cart/checkout/chat pages.
        '3xs': ['0.5625rem', { lineHeight: '0.75rem' }],  // 9px  — was text-[9px]
        '2xs': ['0.625rem',  { lineHeight: '0.875rem' }], // 10px — was text-[10px]
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}

export default config
