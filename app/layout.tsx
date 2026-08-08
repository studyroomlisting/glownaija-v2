export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import BackToTop from '@/components/layout/BackToTop'
import { CartProvider } from '@/hooks/useCart'
import { ThemeProvider } from '@/hooks/useTheme'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://glownaija.vercel.app'),
  title: { default: 'GlowNaija — Nigerian & Afro-Caribbean Beauty', template: '%s | GlowNaija' },
  description: 'Find and book the best Nigerian and Afro-Caribbean hair and beauty salons across the UK.',
  keywords: ['afro hair', 'nigerian salon', 'black hair', 'knotless braids', 'uk beauty'],
  authors: [{ name: 'Nexova Technologies Ltd' }],
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    siteName: 'GlowNaija',
    type: 'website',
    locale: 'en_GB',
    images: [{ url: '/assets/images/og-default.svg', width: 1200, height: 630, alt: 'GlowNaija' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Runs before paint — sets the dark class immediately from the saved
            preference (or OS preference on a first visit), so there's no flash
            of the wrong theme while React hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gn_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <CartProvider>
            {children}
            <BackToTop/>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
