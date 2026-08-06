// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb  from '@/components/layout/Breadcrumb'
import ServiceRow  from '@/components/salon/ServiceRow'
import ReviewCard  from '@/components/salon/ReviewCard'
import { submitEnquiry } from '@/lib/actions/salons'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: salon } = await supabase.from('salons').select('name,description,area,city').eq('slug', params.slug).single()
  if (!salon) return { title: 'Salon Not Found' }
  return {
    title: `${salon.name} — ${salon.area}, ${salon.city}`,
    description: salon.description?.substring(0, 160) || `Book ${salon.name} in ${salon.area}, ${salon.city} on GlowNaija`,
  }
}

export default async function SalonPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: salon } = await supabase.from('salons').select('*').eq('slug', params.slug).eq('is_active', true).single()
  if (!salon) notFound()

  const [
    { data: services },
    { data: hours },
    { data: reviews },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('salon_id', salon.id).eq('is_active', true).order('sort_order'),
    supabase.from('salon_opening_hours').select('*').eq('salon_id', salon.id).order('day_of_week'),
    supabase.from('reviews').select('*, profiles(first_name,last_name)').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(15),
    supabase.auth.getUser(),
  ])

  const isSaved = user
    ? !!(await supabase.from('saved_salons').select('id').eq('user_id', user.id).eq('salon_id', salon.id).single()).data
    : false

  const today = new Date().getDay()
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const svcGroups = (services || []).reduce((acc: any, s: any) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div>
      <Breadcrumb crumbs={[
        { label: 'Home',   href: '/' },
        { label: 'Salons', href: '/salons' },
        { label: salon.city, href: `/location/${salon.city.toLowerCase()}` },
        { label: salon.name },
      ]}/>

      {/* Hero image */}
      <div className="relative overflow-hidden" style={{ height: '18rem', background: 'linear-gradient(135deg, #1C1008, #3B1F6B)' }}>
        {salon.images?.[0] && (
          <img src={salon.images[0]} alt={salon.name} className="w-full h-full object-cover" style={{ opacity: 0.8 }}/>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}/>
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-white text-3xl font-black">{salon.name} {salon.emoji}</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>📍 {salon.area}, {salon.city}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {salon.is_verified && (
              <span className="badge-pill text-white text-xs" style={{ background: 'rgba(16,185,129,0.9)' }}>✓ Verified</span>
            )}
            {salon.is_open && (
              <span className="badge-pill text-white text-xs" style={{ background: 'rgba(16,185,129,0.9)' }}>● Open Now</span>
            )}
            {salon.accepts_online_bookings && (
              <span className="badge-pill text-white text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>📅 Online Booking</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* About */}
            {salon.description && (
              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">About</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{salon.description}</p>
              </div>
            )}

            {/* Services */}
            {(services?.length || 0) > 0 && (
              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">Services</h2>
                {Object.entries(svcGroups).map(([cat, svcs]: [string, any]) => (
                  <div key={cat}>
                    <p className="text-xs font-bold uppercase tracking-wide my-3" style={{ color: 'var(--ink-3)' }}>{cat}</p>
                    {svcs.map((s: any) => <ServiceRow key={s.id} service={s} salonId={salon.id}/>)}
                  </div>
                ))}
              </div>
            )}

            {/* Opening hours */}
            {(hours?.length || 0) > 0 && (
              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">Opening Hours</h2>
                {hours!.map(h => (
                  <div key={h.day_of_week}
                    className="flex justify-between py-2.5 border-b border-bdr"
                    style={h.day_of_week === today ? { fontWeight: 700, color: 'var(--rose)' } : {}}>
                    <span>{days[h.day_of_week]}{h.day_of_week === today ? ' (Today)' : ''}</span>
                    <span>{h.is_closed ? 'Closed' : `${h.open_time?.substring(0,5)} – ${h.close_time?.substring(0,5)}`}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            <div className="card card-body" id="reviews">
              <h2 className="font-bold text-lg mb-4">Reviews ({salon.review_count})</h2>
              {reviews?.length
                ? reviews.map(r => <ReviewCard key={r.id} review={{ ...r, ...(r.profiles as any) }}/>)
                : <p className="text-sm" style={{ color: 'var(--ink-3)' }}>No reviews yet — be the first!</p>
              }
            </div>

            {/* Enquiry form */}
            <div className="card card-body" id="enquiry">
              <h2 className="font-bold text-xl mb-4">📩 Send an Enquiry</h2>
              <form action={submitEnquiry} className="space-y-4">
                <input type="hidden" name="salon_id" value={salon.id}/>
                <input type="hidden" name="enq_slug" value={salon.slug}/>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Your Name *</label>
                    <input name="enq_name" className="input" required/>
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input name="enq_email" type="email" className="input" required/>
                  </div>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="enq_phone" type="tel" className="input" placeholder="+44 7700 900000"/>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <input name="enq_subject" className="input" placeholder="e.g. Pricing for knotless braids"/>
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea name="enq_message" className="input" rows={4} placeholder="Tell us what you need…" required/>
                </div>
                <button type="submit" className="btn btn-primary w-full justify-center">Send Enquiry →</button>
              </form>
            </div>

          </div>

          {/* Right column — sticky sidebar */}
          <div>
            <div className="card card-body" style={{ position: 'sticky', top: '5rem' }}>
              <Link href={`/booking?salon=${salon.id}`} className="btn btn-primary w-full justify-center mb-4">
                Book Appointment →
              </Link>
              {salon.phone && (
                <a href={`tel:${salon.phone}`} className="flex items-center gap-2 py-2.5 border-b border-bdr text-sm font-semibold">
                  📞 {salon.phone}
                </a>
              )}
              {salon.instagram && (
                <a href={`https://instagram.com/${salon.instagram}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 py-2.5 border-b border-bdr text-sm font-semibold">
                  📸 @{salon.instagram}
                </a>
              )}
              {salon.website && (
                <a href={salon.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 py-2.5 text-sm font-semibold">
                  🌐 Website
                </a>
              )}
              <a href="#enquiry" className="btn btn-outline w-full justify-center mt-4 text-sm">
                Send Enquiry
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
