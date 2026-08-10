// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import Image            from 'next/image'
import type { Metadata } from 'next'
import Breadcrumb  from '@/components/layout/Breadcrumb'
import ServiceRow  from '@/components/salon/ServiceRow'
import ReviewCard  from '@/components/salon/ReviewCard'
import SaveButton  from '@/components/salon/SaveButton'
import ReviewForm  from '@/components/salon/ReviewForm'
import Gallery      from '@/components/salon/Gallery'
import { fmtPrice } from '@/lib/utils'
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

  const { data: salon } = await supabase.from('salons').select('*').eq('slug', params.slug).single()
  if (!salon) notFound()

  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (salon.listing_status !== 'approved' || !salon.is_active) {
    let allowed = false
    if (viewer) {
      if (viewer.id === salon.owner_id) allowed = true
      else {
        const { data: viewerProfile } = await supabase.from('profiles').select('is_admin').eq('id', viewer.id).single()
        if (viewerProfile?.is_admin) allowed = true
      }
    }
    if (!allowed) notFound()
  }

  const [
    { data: services },
    { data: hours },
    { data: reviews },
    { data: owner },
    { data: similar },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('salon_id', salon.id).eq('is_active', true).order('sort_order'),
    supabase.from('salon_opening_hours').select('*').eq('salon_id', salon.id).order('day_of_week'),
    supabase.from('reviews').select('*, profiles(first_name,last_name)').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(15),
    supabase.from('profiles').select('first_name,last_name,avatar_url,email').eq('id', salon.owner_id).single(),
    supabase.from('salons').select('*').eq('city', salon.city).eq('listing_status','approved').eq('is_active', true).neq('id', salon.id).order('rating', { ascending: false }).limit(3),
  ])

  const isSaved = viewer
    ? !!(await supabase.from('saved_salons').select('id').eq('user_id', viewer.id).eq('salon_id', salon.id).single()).data
    : false

  const today = new Date().getDay()
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const svcGroups = (services || []).reduce((acc: any, s: any) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})
  const cheapest = services?.length ? Math.min(...services.map(s => s.price)) : salon.price_from * 100
  const todayHours = hours?.find(h => h.day_of_week === today)
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salon.name} ${salon.address || ''} ${salon.area} ${salon.city}`)}`

  return (
    <div>
      {(salon.listing_status !== 'approved' || !salon.is_active) && (
        <div className="bg-gold/10 border-b border-gold/30 py-2.5 text-center text-xs font-bold text-gold">
          ⏳ This listing is pending admin approval and is not visible to the public yet.
        </div>
      )}
      <Breadcrumb crumbs={[
        { label: 'Home',   href: '/' },
        { label: 'Salons', href: '/salons' },
        { label: salon.city, href: `/location/${salon.city.toLowerCase()}` },
        { label: salon.name },
      ]}/>

      {/* Image banner — full width, edge to edge */}
      <div className="relative h-56 sm:h-72 md:h-96 w-full overflow-hidden bg-gradient-to-br from-ink to-purple-900">
        {salon.images?.[0] ? (
          <Image src={salon.images[0]} alt={salon.name} fill priority quality={90} sizes="100vw" className="object-cover"/>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl">{salon.emoji}</div>
        )}
        {(salon.images?.length || 0) > 1 && (
          <a href="#gallery" className="absolute top-4 left-4 badge-pill bg-white/90 text-ink text-xs font-bold flex items-center gap-1.5">
            🎞 View all {salon.images.length} photos
          </a>
        )}
      </div>

      {/* Info card — floats up over the image */}
      <div className="container relative z-10 -mt-16 mb-3">
        <div className="card card-body shadow-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-page-2 flex items-center justify-center text-3xl flex-shrink-0 border-4 border-white shadow-md -mt-1">
                {salon.emoji}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black">{salon.name}</h1>
                <p className="text-ink-3 text-sm mt-1">📍 {salon.area}, {salon.city}{salon.postcode ? `, ${salon.postcode}` : ''}</p>
              </div>
            </div>
            <span className="badge-pill bg-gold/15 text-gold text-sm font-bold flex-shrink-0">★ {salon.rating || '—'} ({salon.review_count} reviews)</span>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap items-center">
            <span className={`badge-pill text-xs font-bold ${salon.is_open ? 'bg-green-100 text-gn' : 'bg-rose-100 text-rose'}`}>● {salon.is_open ? 'Open Now' : 'Closed Now'}</span>
            {salon.is_verified && <span className="badge-pill bg-green-100 text-gn text-xs">✓ Verified</span>}
            {(services?.length || 0) > 0 && <span className="text-xs text-ink-3 flex items-center gap-1">📋 {services.length} Service{services.length !== 1 ? 's' : ''}</span>}
            {salon.accepts_online_bookings && <span className="text-xs text-ink-3 flex items-center gap-1">📅 Online Booking</span>}
          </div>

          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-bdr">
            {salon.phone && <a href={`tel:${salon.phone}`} className="btn btn-outline btn-sm text-xs">📞 Call</a>}
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm text-xs">🧭 Directions</a>
            {salon.website && <a href={salon.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm text-xs">🌐 Website</a>}
          </div>
        </div>
      </div>

      {/* Save / Share + section nav */}
      <div className="container pb-5 border-b border-bdr">
        <div className="flex gap-2 flex-wrap">
          <SaveButton salonId={salon.id} initialSaved={isSaved} className="btn btn-outline btn-sm text-xs"/>
          <a href={`mailto:?subject=${encodeURIComponent(salon.name)}&body=${encodeURIComponent(`Check out ${salon.name} on GlowNaija`)}`}
            className="btn btn-outline btn-sm text-xs">🔗 Share</a>
        </div>

        {/* Section nav */}
        <div className="flex gap-1 flex-wrap mt-4 pt-3 border-t border-bdr">
          {[['about','About'],['pricing','Pricing'],['gallery','Gallery'],['reviews','Reviews'],['location','Location']].map(([id,label]) => (
            <a key={id} href={`#${id}`} className="px-3 py-1.5 text-xs font-bold text-ink-3 hover:text-rose transition-colors">{label}</a>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-6">

            {/* About */}
            {salon.description && (
              <div className="card card-body" id="about">
                <h2 className="font-bold text-lg mb-3">About</h2>
                <p className="text-sm leading-relaxed text-ink-2">{salon.description}</p>
                {salon.accepts_online_bookings && (
                  <span className="badge-pill bg-green-100 text-gn text-2xs mt-3 inline-block">✓ Booking Enabled</span>
                )}
              </div>
            )}

            {/* Services & Pricing */}
            {(services?.length || 0) > 0 && (
              <div className="card card-body" id="pricing">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="font-bold text-lg">Services &amp; Pricing</h2>
                  <span className="text-xs text-ink-3">From <strong className="text-ink">{fmtPrice(cheapest)}</strong></span>
                </div>
                {Object.entries(svcGroups).map(([cat, svcs]: [string, any]) => (
                  <div key={cat}>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-3 my-3">{cat}</p>
                    {svcs.map((s: any) => <ServiceRow key={s.id} service={s} salonId={salon.id}/>)}
                  </div>
                ))}
              </div>
            )}

            {/* Highlights */}
            {(salon.tags?.length || 0) > 0 && (
              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {salon.tags.map((t: string) => (
                    <span key={t} className="badge-pill bg-page-2 text-ink-2 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {(salon.images?.length || 0) > 0 && (
              <div className="card card-body" id="gallery">
                <h2 className="font-bold text-lg mb-3">Gallery</h2>
                <Gallery images={salon.images} alt={salon.name}/>
              </div>
            )}

            {/* Opening hours */}
            {(hours?.length || 0) > 0 && (
              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">Opening Hours</h2>
                {hours!.map(h => (
                  <div key={h.day_of_week} className={`flex justify-between py-2.5 border-b border-bdr last:border-0 ${h.day_of_week === today ? 'font-bold text-rose' : ''}`}>
                    <span>{days[h.day_of_week]}{h.day_of_week === today ? ' (Today)' : ''}</span>
                    <span>{h.is_closed ? 'Closed' : `${h.open_time?.substring(0,5)} – ${h.close_time?.substring(0,5)}`}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            <div className="card card-body" id="reviews">
              <h2 className="font-bold text-lg mb-4">Reviews ({salon.review_count})</h2>
              <div className="mb-5">
                <ReviewForm salonId={salon.id} slug={salon.slug} loggedIn={!!viewer}/>
              </div>
              {reviews?.length
                ? reviews.map(r => <ReviewCard key={r.id} review={{ ...r, ...(r.profiles as any) }}/>)
                : <p className="text-sm text-ink-3">No reviews yet — be the first!</p>
              }
            </div>

            {/* Enquiry form */}
            <div className="card card-body" id="enquiry">
              <h2 className="font-bold text-xl mb-4">📩 Send an Enquiry</h2>
              <form action={submitEnquiry} className="space-y-4">
                <input type="hidden" name="salon_id" value={salon.id}/>
                <input type="hidden" name="enq_slug" value={salon.slug}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Your Name *</label>
                    <input name="enq_name" className="input" pattern="[A-Za-z][A-Za-z\s'.-]{1,59}" title="Letters only" required/>
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input name="enq_email" type="email" className="input" required/>
                  </div>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="enq_phone" type="tel" className="input" placeholder="+44 7700 900000" pattern="[0-9+\s()\-]{7,20}" title="Digits, spaces, +, -, () only"/>
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

            {/* Similar salons */}
            {(similar?.length || 0) > 0 && (
              <div>
                <h2 className="font-bold text-lg mb-3">You may also be interested in</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {similar!.map(s => (
                    <Link key={s.id} href={`/salon/${s.slug}`} className="card group">
                      <div className="relative h-28 bg-gradient-to-br from-ink to-purple-900 overflow-hidden">
                        {s.images?.[0]
                          ? <img src={s.images[0]} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                          : <div className="absolute inset-0 flex items-center justify-center text-4xl">{s.emoji}</div>}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm truncate">{s.name}</p>
                        <p className="text-xs text-ink-3">📍 {s.area}</p>
                        <p className="text-xs text-ink-3 mt-1">★ {s.rating || '—'} ({s.review_count})</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — sticky sidebar */}
          <div>
            <div className="card card-body sticky top-20 space-y-4">
              <div>
                <p className="text-xs text-ink-3">Starting from</p>
                <p className="text-2xl font-black">{fmtPrice(cheapest)}</p>
              </div>

              <Link href={`/booking?salon=${salon.id}`} className="btn btn-primary w-full justify-center">
                Book Appointment →
              </Link>
              <a href="#pricing" className="btn btn-outline w-full justify-center text-sm">Check Availability</a>

              <div className="space-y-2 pt-2 border-t border-bdr text-xs text-ink-3">
                <p>✅ Instant confirmation — no waiting for approval</p>
                <p>💷 Transparent pricing, no hidden charges</p>
                <p>🔒 Secure payments on GlowNaija</p>
                {salon.is_verified && <p>🛡️ Verified salon on GlowNaija</p>}
              </div>

              {owner && (
                <div className="pt-3 border-t border-bdr">
                  <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-2">Salon Owner</p>
                  <div className="flex items-center gap-2.5">
                    {owner.avatar_url
                      ? <img src={owner.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt=""/>
                      : <div className="w-9 h-9 rounded-full bg-rose flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{owner.first_name?.[0] || '?'}</div>}
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{owner.first_name} {owner.last_name}</p>
                      <a href="#enquiry" className="text-2xs text-rose font-semibold">Contact via enquiry form</a>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-bdr">
                <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">Today</p>
                <p className="text-sm font-semibold">
                  {todayHours ? (todayHours.is_closed ? 'Closed today' : `${todayHours.open_time?.substring(0,5)} – ${todayHours.close_time?.substring(0,5)}`) : 'Hours not set'}
                </p>
              </div>

              <div className="pt-3 border-t border-bdr space-y-2" id="location">
                <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-1">Location</p>
                {salon.address && <p className="text-sm">{salon.address}</p>}
                <p className="text-sm text-ink-3">{salon.area}, {salon.city}{salon.postcode ? `, ${salon.postcode}` : ''}</p>
                {salon.phone && <a href={`tel:${salon.phone}`} className="flex items-center gap-2 text-sm font-semibold">📞 {salon.phone}</a>}
                {salon.instagram && (
                  <a href={`https://instagram.com/${salon.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold">
                    📸 @{salon.instagram}
                  </a>
                )}
                {(salon.facebook || salon.twitter || salon.youtube || salon.linkedin || salon.whatsapp || salon.google_business) && (
                  <div className="flex gap-2 pt-1">
                    {salon.facebook && <a href={salon.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">📘</a>}
                    {salon.twitter && <a href={salon.twitter} target="_blank" rel="noreferrer" aria-label="Twitter / X" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">🐦</a>}
                    {salon.youtube && <a href={salon.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">▶️</a>}
                    {salon.linkedin && <a href={salon.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">💼</a>}
                    {salon.whatsapp && <a href={salon.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">💬</a>}
                    {salon.google_business && <a href={salon.google_business} target="_blank" rel="noreferrer" aria-label="Google Business" className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center hover:bg-rose-50">📍</a>}
                  </div>
                )}
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn btn-outline w-full justify-center text-xs mt-2">🧭 Get Directions</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
