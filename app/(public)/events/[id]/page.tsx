// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { registerForEvent } from '@/lib/actions/events'
import { fmtPrice } from '@/lib/utils'
export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: e } = await supabase.from('events').select('*').eq('id', params.id).eq('is_active',true).single()
  if (!e) notFound()
  const { data: { user } } = await supabase.auth.getUser()
  const isFull = e.rsvp_count >= e.capacity
  const isPast = e.event_date < new Date().toISOString().split('T')[0]
  return (
    <div className="container py-10 max-w-3xl">
      <div className="h-56 rounded-2xl bg-gradient-to-br from-ink to-purple-800 mb-6 relative overflow-hidden">
        {e.image_url ? <img src={e.image_url} className="w-full h-full object-cover opacity-80"/> : <div className="absolute inset-0 flex items-center justify-center text-8xl">{e.emoji}</div>}
      </div>
      <h1 className="text-3xl font-black mb-3">{e.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-ink-3 mb-6">
        <span>📅 {new Date(e.event_date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
        <span>⏰ {e.time_start?.substring(0,5)} – {e.time_end?.substring(0,5)}</span>
        <span>📍 {e.venue}, {e.city}</span>
        <span>💰 {e.is_free?'Free':fmtPrice(e.price)}</span>
        <span>👥 {e.rsvp_count}/{e.capacity} registered</span>
      </div>
      {e.description && <p className="text-ink-2 leading-relaxed mb-8">{e.description}</p>}
      {!isPast && !isFull && (
        <div className="card card-body">
          <h2 className="font-bold text-lg mb-4">Register for this event</h2>
          <form action={registerForEvent} className="space-y-4">
            <input type="hidden" name="event_id" value={e.id}/>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Name *</label><input name="name" className="input" defaultValue={user?'':''} required/></div><div><label className="label">Email *</label><input name="email" type="email" className="input" required/></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Phone</label><input name="phone" type="tel" className="input"/></div><div><label className="label">Tickets</label><select name="tickets" className="input">{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div></div>
            <button type="submit" className="btn btn-primary w-full justify-center">{e.is_free?'Register Free →':`Register — ${fmtPrice(e.price)} →`}</button>
          </form>
        </div>
      )}
      {isFull && <div className="card card-body text-center py-8 text-ink-3"><p className="text-2xl mb-2">😔</p><p className="font-bold">This event is sold out</p></div>}
      {isPast && <div className="card card-body text-center py-8 text-ink-3"><p className="font-bold">This event has passed</p></div>}
    </div>
  )
}