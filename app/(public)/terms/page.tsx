import PageHero from '@/components/layout/PageHero'
export default function TermsPage() {
  const sections = [
    ['1. Acceptance','By using GlowNaija you agree to these Terms. If you don\'t agree, please don\'t use the platform.'],
    ['2. Platform Role','GlowNaija is a marketplace. All bookings are between you and the salon. We are not responsible for salon services.'],
    ['3. Deposits','Deposits secure appointments and are non-refundable for cancellations less than 24 hours before the appointment.'],
    ['4. Reviews','Reviews must be genuine. False reviews may result in account suspension and could constitute fraud.'],
    ['5. Prohibited Use','No fraud, data scraping, security bypassing, or illegal activity on the platform.'],
    ['6. Intellectual Property','All GlowNaija branding, design, and code is owned by Nexova Technologies Ltd.'],
    ['7. Governing Law','English law applies. Disputes subject to jurisdiction of English courts.'],
    ['8. Contact','legal@glownaija.co.uk'],
  ]
  return (<><PageHero title="Terms of Service" subtitle="Last updated July 2026"/><div className="container py-10 max-w-2xl space-y-4">{sections.map(([t,b])=><div key={t} className="card card-body"><h2 className="font-bold text-base mb-2">{t}</h2><p className="text-ink-2 text-sm leading-relaxed">{b}</p></div>)}</div></>)
}