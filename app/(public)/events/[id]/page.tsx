// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { registerForEvent } from '@/lib/actions/events'
import { fmtPrice, ukDateString } from '@/lib/utils'
import ActionForm from '@/components/dashboard/ActionForm'
import Link from 'next/link'

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: e } = await supabase.from('events').select('*').eq('id', params.id).eq('is_active',true).single()
  if (!e) notFound()
  const { data: { user } } = await supabase.auth.getUser()
  const isFull = e.rsvp_count >= e.capacity
  const isPast = e.event_date < ukDateString()
  const spotsLeft = Math.max(0, e.capacity - e.rsvp_count)

  return (
    <div className="container py-10 max-w-3xl">

      {/* Hero image */}
      <div className="h-56 sm:h-72 rounded-2xl bg-gradient-to-br from-ink to-purple-800 mb-6 relative overflow-hidden">
        {e.image_url ? <img src={e.image_url} className="w-full h-full object-cover"/> : <div className="absolute inset-0 flex items-center justify-center text-8xl">{e.emoji}</div>}
      </div>

      <h1 className="text-3xl font-black mb-3">{e.title}</h1>

      {/* Meta rows */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2 mb-3">
        <span className="flex items-center gap-1.5">📅 {new Date(e.event_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
        <span className="flex items-center gap-1.5">⏰ {e.time_start?.substring(0,5)} – {e.time_end?.substring(0,5)}</span>
        <span className="flex items-center gap-1.5">📍 {e.venue}, {e.city}</span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2 mb-6">
        <span className="flex items-center gap-1.5 font-bold text-rose">{e.is_free ? '🏷️ Free' : `🏷️ ${fmtPrice(e.price)}`}</span>
        <span className="flex items-center gap-1.5">👥 {e.rsvp_count}/{e.capacity} registered</span>
      </div>

      <div className="border-t border-bdr mb-6"/>

      {e.description && <p className="text-ink-2 leading-relaxed mb-8">{e.description}</p>}

      {user?.id === e.organiser_id && (
        <div className="card card-body bg-rose-50 border-rose/20 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-sm">📋 You organised this event</p>
            <p className="text-xs text-ink-3">Manage registrations, edit details, or cancel it.</p>
          </div>
          <Link href={`/events/${e.id}/dashboard`} className="btn btn-primary btn-sm">Manage Event →</Link>
        </div>
      )}

      {!isPast && !isFull && (
        <div className="card card-body">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center text-lg flex-shrink-0">👥</span>
            <div>
              <h2 className="font-bold text-lg">Register for this event</h2>
              <p className="text-xs text-ink-3">Secure your spot by filling out the form below.</p>
            </div>
          </div>

          <ActionForm action={registerForEvent} successMessage="You're registered! Check your email for confirmation." className="space-y-4"
            submitLabel={e.is_free ? 'Register Free →' : `Register — ${fmtPrice(e.price)} →`}
            submitClassName="btn btn-primary w-full justify-center text-base py-3.5">
            <input type="hidden" name="event_id" value={e.id}/>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">👤</span>
                  <input name="name" className="input pl-9" placeholder="Enter your full name" pattern="[A-Za-z][A-Za-z\s'.-]{1,59}" title="Letters only" required/>
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">✉️</span>
                  <input name="email" type="email" className="input pl-9" placeholder="Enter your email address" required/>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">📞</span>
                  <input name="phone" type="tel" className="input pl-9" placeholder="Enter your phone number" pattern="[0-9+\s()\-]{7,20}" title="Digits, spaces, +, -, () only"/>
                </div>
              </div>
              <div>
                <label className="label">Tickets</label>
                <select name="tickets" className="input">
                  {Array.from({ length: Math.min(5, spotsLeft || 5) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} Ticket{n > 1 ? 's' : ''} — {e.is_free ? 'Free' : fmtPrice(e.price * n)}</option>
                  ))}
                </select>
              </div>
            </div>
          </ActionForm>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-bdr text-center">
            {[['🔒','Secure Checkout','Your payment is encrypted'],['⚡','Instant Confirmation','Get your ticket instantly'],['🔔','Limited Seats',`Only ${e.capacity} seats available`]].map(([icon,title,desc]) => (
              <div key={title}>
                <span className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-sm mx-auto mb-1.5">{icon}</span>
                <p className="text-2xs font-bold text-ink-2">{title}</p>
                <p className="text-3xs text-ink-3 mt-0.5 hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFull && <div className="card card-body text-center py-8 text-ink-3"><p className="text-2xl mb-2">😔</p><p className="font-bold">This event is sold out</p></div>}
      {isPast && <div className="card card-body text-center py-8 text-ink-3"><p className="font-bold">This event has passed</p></div>}
    </div>
  )
}
