'use client'
import Link from 'next/link'

const COLUMNS: [string, [string, string][]][] = [
  ['Explore',  [['/salons', 'Find a Salon'], ['/shop', 'Beauty Shop'], ['/events', 'Events'], ['/stylist', 'AI Stylist'], ['/chat', 'Glow AI']]],
  ['Business', [['/business', 'List Your Salon'], ['/auth/signup?role=owner', 'Salon Owner Sign Up'], ['/dashboard', 'Owner Dashboard']]],
  ['Company',  [['/about', 'About Us'], ['/contact', 'Contact Us'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service']]],
]

const SOCIALS: [string, string][] = [
  ['📷', 'https://instagram.com/glownaija'],
  ['📘', 'https://facebook.com/glownaija'],
  ['🎵', 'https://tiktok.com/@glownaija'],
  ['▶️', 'https://youtube.com/@glownaija'],
]

const TRUST_ROW: [string, string, string][] = [
  ['🛡️', 'Secure Payments', '100% secure transactions'],
  ['🎧', '24/7 Support', "We're here for you always"],
  ['🏅', 'Quality Guarantee', 'Trusted salons & products'],
  ['🔒', 'Your Privacy', 'We respect your privacy'],
]

export default function Footer() {
  return (
    <footer className="bg-ink text-white relative">
      <div className="h-1 bg-gradient-to-r from-rose via-gold to-rose" />

      <div className="container pt-14 pb-10 grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-10">

        {/* Brand */}
        <div className="col-span-2 md:col-span-2 pr-4">
          <div className="text-xl font-black mb-1"><span className="text-rose">Glow</span>Naija</div>
          <p className="text-2xs font-semibold text-ink-3-on-dark tracking-wide mb-3">Beauty. Style. You.</p>
          <p className="text-xs text-ink-3-on-dark leading-relaxed max-w-[240px] mb-4">
            The UK's Nigerian &amp; Afro-Caribbean beauty marketplace. Discover, book, and glow with confidence.
          </p>
          <div className="flex gap-2 mb-5">
            {SOCIALS.map(([icon, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-sm hover:border-rose hover:bg-rose/10 transition-colors">
                {icon}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 max-w-[240px]">
            <span className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-sm flex-shrink-0">🛡️</span>
            <p className="text-2xs font-bold leading-snug">Trusted by 50K+ customers <span className="font-normal text-ink-3-on-dark">across the UK</span></p>
          </div>
        </div>

        {COLUMNS.map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 pb-2 border-b-2 border-rose inline-block">{title}</p>
            <div className="flex flex-col gap-2.5 mt-1">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="text-sm text-white/70 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        ))}

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-white mb-3 pb-2 border-b-2 border-rose inline-block">Stay in the Glow</p>
          <p className="text-sm text-white/70 mb-3 mt-1">Beauty tips, offers and updates straight to your inbox.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex rounded-xl overflow-hidden border border-white/15 bg-white/5 focus-within:border-rose transition-colors mb-4"
          >
            <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-none flex-shrink-0">Subscribe →</button>
          </form>
          <div className="flex gap-3">
            {[['🏷️', 'Exclusive offers'], ['✨', 'Beauty tips'], ['🎁', 'Giveaways']].map(([icon, label]) => (
              <div key={label} className="text-center">
                <span className="w-9 h-9 rounded-full bg-rose/20 flex items-center justify-center text-sm mx-auto mb-1">{icon}</span>
                <p className="text-3xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust row */}
      <div className="container pb-10">
        <div className="border-t border-white/10 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ROW.map(([icon, title, desc]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-rose to-purple-700 flex items-center justify-center text-lg flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-2xs text-white/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex items-center justify-between flex-wrap gap-4">
          <p className="text-2xs text-white/50">© {new Date().getFullYear()} Nexova Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {['VISA', 'MC', 'AMEX', 'Apple Pay', 'G Pay'].map(c => (
                <span key={c} className="text-3xs font-bold text-white/70 px-2 py-1 bg-white/5 rounded border border-white/10">{c}</span>
              ))}
            </div>
            <Link href="/privacy" className="text-2xs text-white/50 hover:text-white">Cookies Settings</Link>
            <Link href="/sitemap.xml" className="text-2xs text-white/50 hover:text-white">Sitemap</Link>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
              ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
