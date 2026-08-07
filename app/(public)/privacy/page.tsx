'use client'
import AccordionItem from '@/components/layout/AccordionItem'

const SECTIONS: [string, string, React.ReactNode][] = [
  ['🏢', 'Who We Are', <>GlowNaija is operated by Nexova Technologies Ltd, registered in England and Wales.<br/>📧 <a href="mailto:privacy@glownaija.co.uk" className="text-rose font-semibold">privacy@glownaija.co.uk</a></>],
  ['🗄️', 'Data We Collect', 'We collect account information, profile preferences, booking and order history, reviews, device information, and payment data (processed securely via Stripe).'],
  ['📊', 'How We Use It', 'We use your data to process bookings and orders, send confirmations, personalise recommendations, improve our platform, and comply with legal obligations.'],
  ['🔗', 'Data Sharing', <>We only share your data with trusted partners: Stripe (payments), Resend (emails), Supabase (database hosting), and salon owners (for your bookings).<br/><strong>🔒 We never sell your data.</strong></>],
  ['📋', 'Your GDPR Rights', <>You have the right to access, correct, or erase your data from your Account Settings.<br/>To delete your account, email <a href="mailto:privacy@glownaija.co.uk" className="text-rose font-semibold">privacy@glownaija.co.uk</a>.<br/>Complaints: <a href="https://ico.org.uk" target="_blank" rel="noreferrer" className="text-rose font-semibold">ico.org.uk</a></>],
  ['🛡️', 'Security', 'We use industry-standard security measures including bcrypt password hashing, TLS encryption in transit, PCI DSS via Stripe, and Row Level Security in Supabase.'],
  ['✉️', 'Contact Us', <>For any privacy-related questions, reach out to us.<br/>📧 <a href="mailto:privacy@glownaija.co.uk" className="text-rose font-semibold">privacy@glownaija.co.uk</a> · DPO: <a href="mailto:dpo@glownaija.co.uk" className="text-rose font-semibold">dpo@glownaija.co.uk</a></>],
]

export default function PrivacyPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-rose-50 py-12">
        <div className="container grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <span className="badge-pill bg-white text-rose text-xs font-bold mb-3 inline-flex items-center gap-1">🛡️ Your privacy matters</span>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Privacy <span className="text-rose">Policy</span></h1>
            <p className="text-ink-3 text-sm max-w-lg mb-3">This Privacy Policy explains how GlowNaija collects, uses, and protects your personal information.</p>
            <p className="text-2xs text-ink-3 flex items-center gap-1.5">📅 Last updated: July 2026</p>
          </div>
          <div className="hidden md:flex w-40 h-40 rounded-3xl bg-gradient-to-br from-rose to-purple-700 shadow-md items-center justify-center text-6xl flex-shrink-0">🔐</div>
        </div>
      </div>

      <div className="container py-10 max-w-3xl">
        <div className="card overflow-hidden">
          {SECTIONS.map(([icon, title, body], i) => (
            <div key={title} className="px-5">
              <AccordionItem title={`${i + 1}. ${title}`} defaultOpen={i === 0}
                icon={<span className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-base flex-shrink-0">{icon}</span>}>
                {body}
              </AccordionItem>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card card-body bg-rose-50 border-0 flex items-center justify-between flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-xl flex-shrink-0">🛡️</span>
            <div>
              <p className="font-bold">We are committed to protecting your privacy</p>
              <p className="text-sm text-ink-3">Your trust is important to us. We handle your data with care and transparency.</p>
            </div>
          </div>
          <a href="/contact" className="btn btn-primary btn-sm flex-shrink-0">Contact Support →</a>
        </div>
      </div>

      {/* Newsletter bar */}
      <div className="bg-gradient-to-r from-rose to-purple-700 py-8 mt-6">
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white font-black text-lg">✨ Stay in the Glow</p>
            <p className="text-white/70 text-sm">Subscribe to get beauty tips, offers and updates straight to your inbox.</p>
          </div>
          <form onSubmit={e => e.preventDefault()} className="flex gap-2 w-full sm:w-auto">
            <input type="email" required placeholder="Enter your email" className="input flex-1 sm:w-64 bg-white"/>
            <button type="submit" className="btn bg-ink text-white hover:bg-ink/90 flex-shrink-0">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  )
}
