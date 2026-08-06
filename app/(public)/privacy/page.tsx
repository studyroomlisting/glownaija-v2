// @ts-nocheck
export const dynamic = 'force-dynamic'
import PageHero from '@/components/layout/PageHero'
export default function PrivacyPage() {
  const sections = [
    ['Who We Are','GlowNaija is operated by Nexova Technologies Ltd, registered in England and Wales. Contact: privacy@glownaija.co.uk'],
    ['Data We Collect','Account info (name, email, password hash), profile preferences (hair type, city), booking and order history, reviews, and device info for security. Payments are processed by Stripe — we never store card details.'],
    ['How We Use It','To process bookings and orders, send confirmations, personalise recommendations, improve our platform, and comply with legal obligations.'],
    ['Data Sharing','Only with: Stripe (payments), Resend (email), Supabase (database hosting), salon owners (for your bookings). We never sell your data.'],
    ['Your GDPR Rights','Access, correct, or erase your data in Account Settings. To delete your account email privacy@glownaija.co.uk. Complaints: ico.org.uk.'],
    ['Security','bcrypt password hashing, TLS encryption in transit, PCI DSS via Stripe, Row Level Security in Supabase.'],
    ['Contact','privacy@glownaija.co.uk · DPO: dpo@glownaija.co.uk'],
  ]
  return (<><PageHero title="Privacy Policy" subtitle="Last updated July 2026"/><div className="container py-10 max-w-2xl space-y-4">{sections.map(([t,b])=><div key={t} className="card card-body"><h2 className="font-bold text-base mb-2">{t}</h2><p className="text-ink-2 text-sm leading-relaxed">{b}</p></div>)}</div></>)
}