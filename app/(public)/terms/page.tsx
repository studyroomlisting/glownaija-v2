'use client'
import Link from 'next/link'
import { useState } from 'react'
import AccordionItem from '@/components/layout/AccordionItem'

const SECTIONS: [string, string, string][] = [
  ['👤', 'Acceptance of Terms', "By accessing or using GlowNaija, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our platform."],
  ['🏪', 'Platform Role', 'GlowNaija acts as a marketplace connecting users with salons and beauty services. All bookings are between you and the salon — GlowNaija is not responsible for the services provided.'],
  ['📅', 'Bookings & Payments', 'All bookings are between you and the salon. Payments (including deposits) are processed securely via Stripe. Deposits are non-refundable for cancellations made less than 24 hours before the appointment.'],
  ['🛡️', 'User Responsibilities', 'You agree to provide accurate information and use the platform responsibly. Reviews must be genuine — false reviews may result in account suspension.'],
  ['🚫', 'Prohibited Use', 'You may not use the platform for any illegal, harmful, or unauthorised activities, including fraud, data scraping, or attempting to bypass platform security.'],
  ['©️', 'Intellectual Property', 'All content, branding, and materials on GlowNaija belong to Nexova Technologies Ltd and may not be used without permission.'],
  ['⚖️', 'Limitation of Liability', 'GlowNaija is not liable for any indirect, incidental, or consequential damages arising from your use of the platform or from services provided by salons listed on it.'],
  ['⚖️', 'Governing Law', 'These terms are governed by the laws of England and Wales. Disputes are subject to the jurisdiction of the English courts.'],
  ['🛡️', 'Changes to Terms', 'We may update these terms from time to time. Continued use of GlowNaija after changes means you accept the updated terms.'],
  ['📄', 'Contact Us', 'For any questions, reach out to us at legal@glownaija.co.uk.'],
]

export default function TermsPage() {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Hero */}
      <div className="bg-rose-50 py-12">
        <div className="container grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <span className="badge-pill bg-white text-rose text-xs font-bold mb-3 inline-flex items-center gap-1">🛡️ Legal</span>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Terms of <span className="text-rose">Service</span></h1>
            <p className="text-ink-3 text-sm max-w-lg mb-3">Please read these terms carefully before using GlowNaija. They govern your use of our platform and services.</p>
            <p className="text-2xs text-ink-3 flex items-center gap-1.5">📅 Last updated: July 2026</p>
          </div>
          <div className="hidden md:flex w-40 h-40 rounded-3xl bg-white shadow-md items-center justify-center text-6xl flex-shrink-0">📋</div>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">

          {/* Sidebar TOC */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="card card-body">
              <p className="font-bold text-sm mb-3">On this page</p>
              <div className="space-y-1">
                {SECTIONS.map(([, title], i) => (
                  <a key={title} href={`#section-${i}`} onClick={() => setActive(i)}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${active === i ? 'bg-rose-50 text-rose font-bold' : 'text-ink-2 hover:bg-page-2'}`}>
                    <span className="text-xs">{i + 1}.</span> {title}
                  </a>
                ))}
              </div>
            </div>
            <div className="card card-body bg-rose-50 border-0">
              <p className="font-bold text-sm mb-1">🛡️ Your trust matters</p>
              <p className="text-xs text-ink-3">We're committed to transparency and protecting your rights.</p>
            </div>
          </div>

          {/* Sections */}
          <div className="card overflow-hidden">
            {SECTIONS.map(([icon, title, body], i) => (
              <div key={title} id={`section-${i}`} className="px-5 scroll-mt-20">
                <AccordionItem
                  defaultOpen={i === 0}
                  icon={<span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'bg-rose text-white' : 'bg-page-2 text-rose'}`}>{i + 1}</span>}
                  title={title}
                >
                  {body}
                </AccordionItem>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="card card-body flex items-center justify-between flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">💌</span>
              <div>
                <p className="font-bold">Questions about our terms?</p>
                <p className="text-sm text-ink-3">If you have any questions or need clarification, we're here to help.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/contact" className="btn btn-primary btn-sm">Contact Us →</Link>
              <Link href="/privacy" className="btn btn-outline btn-sm">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
