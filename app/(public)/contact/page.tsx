'use client'
import { useState } from 'react'
import AccordionItem from '@/components/layout/AccordionItem'

const FAQS: [string, string][] = [
  ['How do I book a salon on GlowNaija?', 'Simply search for your preferred service or salon, choose a time that works for you, and confirm your booking in just a few clicks.'],
  ['Can I cancel or reschedule my appointment?', 'Yes — you can cancel a pending or confirmed booking from your account dashboard. Please check the salon\'s cancellation policy for any deposit terms.'],
  ['How do I list my salon on GlowNaija?', 'Sign up as a Salon Owner, then use "List Your Salon" to submit your details. Your listing goes live once approved by our team.'],
  ['Is my payment information secure?', 'Yes. All payments are processed securely via Stripe — GlowNaija never stores your card details.'],
  ['How can I track my order from the shop?', 'Log in and go to Account → Orders to see the status of any beauty product orders you\'ve placed.'],
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'), email: fd.get('email'),
        subject: fd.get('subject'), message: fd.get('message'),
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div>
      {/* Hero + form */}
      <div className="bg-gradient-to-b from-rose-50 to-page py-14">
        <div className="container grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="badge-pill bg-white text-rose text-xs font-bold mb-4 inline-block">💗 We're here for you</span>
            <h1 className="text-4xl font-black mb-3">Let's <span className="text-rose">Talk</span></h1>
            <p className="text-ink-3 text-base mb-8 max-w-sm">Have a question, feedback or need support? Our team is ready to help you.</p>

            <div className="space-y-5">
              {[
                ['⚡', 'Fast Response', 'We reply within 24 hours'],
                ['🤝', 'Friendly Support', "We're here to help you succeed"],
                ['🛡️', 'Trusted by Thousands', 'Your satisfaction is our priority'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold text-sm">{title}</p>
                    <p className="text-xs text-ink-3">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <h2 className="font-bold text-lg mb-4">Send us a Message ✨</h2>
            {sent ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-black text-lg mb-2">Message sent!</h3>
                <p className="text-ink-3 text-sm">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="alert-error">{error}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Full Name *</label><input name="name" className="input" placeholder="Your name" pattern="[A-Za-z][A-Za-z\s'.-]{1,59}" title="Letters only" required/></div>
                  <div><label className="label">Email Address *</label><input name="email" type="email" className="input" placeholder="you@example.com" required/></div>
                </div>
                <div><label className="label">Subject *</label><input name="subject" className="input" placeholder="How can we help?" required/></div>
                <div><label className="label">Message *</label><textarea name="message" className="input" rows={5} placeholder="Tell us more…" required minLength={10}/></div>
                <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3.5">{loading ? 'Sending…' : 'Send Message →'}</button>
                <p className="text-2xs text-ink-3 text-center flex items-center justify-center gap-1">🛡️ We respect your privacy. Your information is safe with us.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Other ways to reach us */}
      <div className="container py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black mb-1">Other Ways to <span className="text-rose">Reach Us</span></h2>
          <p className="text-ink-3 text-sm">Choose the option that works best for you</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['✉️', 'Email Us', 'hello@glownaija.co.uk', "We'll respond within 24 hours"],
            ['📞', 'Call Us', '+44 20 7946 0958', 'Mon – Fri, 9AM – 6PM (GMT)'],
            ['📍', 'Office Address', 'Nexova Technologies Ltd', 'London, United Kingdom'],
            ['💬', 'Live Chat', 'Chat with our support team', 'in real-time (Coming soon)'],
          ].map(([icon, title, line1, line2]) => (
            <div key={title} className="card card-body text-center">
              <span className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center text-lg mx-auto mb-3">{icon}</span>
              <p className="font-bold text-sm mb-2">{title}</p>
              <p className="text-xs text-ink-2 font-semibold">{line1}</p>
              <p className="text-2xs text-ink-3 mt-0.5">{line2}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-rose-50 py-14">
        <div className="container grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <div>
            <span className="badge-pill bg-white text-rose text-xs font-bold mb-3 inline-block">💗 Need quick answers?</span>
            <h2 className="text-2xl font-black mb-2">Frequently Asked <span className="text-rose">Questions</span></h2>
            <p className="text-ink-3 text-sm mb-5">Find answers to the most common questions about GlowNaija.</p>
          </div>
          <div className="card card-body">
            {FAQS.map(([q, a], i) => (
              <AccordionItem key={q} title={q} defaultOpen={i === 0}>{a}</AccordionItem>
            ))}
          </div>
        </div>
      </div>

      {/* Map + office */}
      <div className="container py-14 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-stretch">
        <div className="rounded-2xl overflow-hidden border border-bdr min-h-[320px]">
          <iframe
            title="GlowNaija office location"
            src="https://www.google.com/maps?q=71-75+Shelton+Street,+Covent+Garden,+London+WC2H+9JQ&output=embed"
            className="w-full h-full min-h-[320px] border-0"
            loading="lazy"
          />
        </div>
        <div className="card card-body">
          <span className="badge-pill bg-rose-100 text-rose text-xs font-bold mb-3 inline-block">📍 Our Location</span>
          <h3 className="font-black text-xl mb-2">Visit Our Office</h3>
          <p className="text-ink-3 text-sm mb-4">We'd love to meet you! Feel free to visit our office during business hours.</p>
          <div className="flex items-start gap-2.5 mb-3">
            <span className="mt-0.5">📍</span>
            <p className="text-sm">Nexova Technologies Ltd<br/>71-75 Shelton Street<br/>Covent Garden, London<br/>WC2H 9JQ, United Kingdom</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5">🕐</span>
            <p className="text-sm">Mon – Fri: 9:00 AM – 6:00 PM (GMT)<br/>Sat – Sun: Closed</p>
          </div>
        </div>
      </div>

      {/* Newsletter bar */}
      <div className="bg-gradient-to-r from-rose to-purple-700 py-8">
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
