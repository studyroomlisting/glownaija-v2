'use client'
import Link from 'next/link'

const COLUMNS: [string, [string, string][]][] = [
  ['Explore',  [['/salons', 'Find a Salon'], ['/shop', 'Beauty Shop'], ['/events', 'Events'], ['/stylist', 'AI Stylist'], ['/chat', 'Glow AI']]],
  ['Business', [['/business', 'List Your Salon'], ['/auth/signup?role=owner', 'Salon Owner Sign Up'], ['/dashboard', 'Owner Dashboard']]],
  ['Company',  [['/contact', 'Contact Us'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service']]],
]

export default function Footer() {
  return (
    <footer className="bg-ink text-white mt-16">
      <div className="container py-14 grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-10">

        {/* Brand */}
        <div className="col-span-2 md:col-span-2 pr-4">
          <div className="text-xl font-black mb-1"><span className="text-rose">Glow</span>Naija</div>
          <p className="text-2xs font-semibold text-ink-3-on-dark tracking-wide mb-3">Beauty. Style. You.</p>
          <p className="text-xs text-ink-3-on-dark leading-relaxed max-w-[220px]">The UK's Nigerian &amp; Afro-Caribbean beauty marketplace.</p>
          <p className="text-xs text-ink-3-on-dark mt-3">© {new Date().getFullYear()} Nexova Technologies Ltd</p>
        </div>

        {COLUMNS.map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3-on-dark mb-3">{title}</p>
            <div className="flex flex-col gap-2.5">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="text-sm text-white/70 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        ))}

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3-on-dark mb-3">Stay in the Glow</p>
          <p className="text-sm text-white/70 mb-3">Beauty tips, offers and updates straight to your inbox.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex rounded-xl overflow-hidden border border-white/15 bg-white/5 focus-within:border-rose transition-colors"
          >
            <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-none flex-shrink-0">Subscribe</button>
          </form>
        </div>
      </div>
    </footer>
  )
}
