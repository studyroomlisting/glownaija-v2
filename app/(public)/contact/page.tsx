"use client"
import { useState } from 'react'
import PageHero from '@/components/layout/PageHero'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true)
    await new Promise(r=>setTimeout(r,1000))
    setSent(true); setLoading(false)
  }
  return (
    <>
      <PageHero title="Contact Us" subtitle="We'd love to hear from you"/>
      <div className="container py-12 max-w-xl">
        {sent ? <div className="card card-body text-center py-16"><div className="text-5xl mb-4">✅</div><h2 className="font-black text-xl mb-2">Message sent!</h2><p className="text-ink-3">We'll get back to you within 24 hours.</p></div>
        : <div className="card card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Name *</label><input className="input" placeholder="Your name" required/></div><div><label className="label">Email *</label><input type="email" className="input" placeholder="you@example.com" required/></div></div>
            <div><label className="label">Subject</label><input className="input" placeholder="How can we help?"/></div>
            <div><label className="label">Message *</label><textarea className="input" rows={5} placeholder="Tell us more…" required/></div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">{loading?'Sending…':'Send Message →'}</button>
          </form>
          <div className="mt-6 pt-6 border-t border-bdr text-sm text-ink-3 space-y-2">
            <p>📧 hello@glownaija.co.uk</p><p>🏢 Nexova Technologies Ltd, London, UK</p>
          </div>
        </div>}
      </div>
    </>
  )
}