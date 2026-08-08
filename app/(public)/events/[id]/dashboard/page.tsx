// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { updateEvent, deleteEvent } from '@/lib/actions/events'
import ActionForm from '@/components/dashboard/ActionForm'
import ActionButton from '@/components/dashboard/ActionButton'
import EventImageUpload from '@/components/events/EventImageUpload'
import { ukDateString } from '@/lib/utils'

export default async function EventDashboardPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: event } = await supabase.from('events').select('*').eq('id', params.id).eq('organiser_id', user.id).single()
  if (!event) notFound()

  const { data: registrations } = await supabase.from('event_registrations').select('*').eq('event_id', params.id).order('created_at')

  const cities = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other']
  const eventTypes = ['workshop','masterclass','meetup','popup','launch','conference']

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-2xl font-black">{event.title}</h1>
        <Link href={`/events/${event.id}`} className="btn btn-outline btn-sm text-xs">👁 View Public Page</Link>
      </div>
      <p className="text-ink-3 mb-6">{registrations?.length || 0} / {event.capacity} registered</p>

      {/* Attendees */}
      <div className="card card-body mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Attendees</h2>
          <a href={`/api/export-event?id=${params.id}`} className="btn btn-outline btn-sm">⬇ Export CSV</a>
        </div>
        {!registrations?.length ? (
          <p className="text-ink-3 text-sm text-center py-8">No registrations yet</p>
        ) : (
          <div className="space-y-3">
            {registrations.map(r => (
              <div key={r.id} className="flex justify-between py-3 border-b border-bdr last:border-0">
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-ink-3">{r.email}{r.phone ? ' · ' + r.phone : ''}</p>
                </div>
                <span className="text-xs text-ink-3">{r.tickets} ticket{r.tickets !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit event */}
      <div className="card card-body mb-6">
        <h2 className="font-bold mb-4">Edit Event</h2>
        <ActionForm action={updateEvent} successMessage="Event updated!" submitLabel="Save Changes →" className="space-y-4">
          <input type="hidden" name="event_id" value={event.id} />
          <div>
            <label className="label">Event Title *</label>
            <input name="title" className="input" defaultValue={event.title} minLength={3} maxLength={120} required/>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={3} maxLength={1000} defaultValue={event.description || ''}/>
          </div>
          <EventImageUpload initialUrl={event.image_url}/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Event Type</label>
              <select name="event_type" className="input" defaultValue={event.event_type}>
                {eventTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Icon</label>
              <select name="emoji" className="input text-lg" defaultValue={event.emoji}>
                {['🎉','💇🏾‍♀️','💅','💄','✂️','🧴','👑','🎓'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input name="event_date" type="date" className="input" defaultValue={event.event_date} min={ukDateString()} required/>
            </div>
            <div>
              <label className="label">City *</label>
              <select name="city" className="input" defaultValue={event.city}>{cities.map(c => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Time *</label><input name="time_start" type="time" className="input" defaultValue={event.time_start?.substring(0,5)} required/></div>
            <div><label className="label">End Time *</label><input name="time_end" type="time" className="input" defaultValue={event.time_end?.substring(0,5)} required/></div>
          </div>
          <div>
            <label className="label">Venue *</label>
            <input name="venue" className="input" defaultValue={event.venue} required/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Price (£)</label><input name="price" type="number" className="input" defaultValue={(event.price/100).toFixed(2)} min="0" step="0.01"/></div>
            <div><label className="label">Capacity *</label><input name="capacity" type="number" className="input" defaultValue={event.capacity} min="1" max="10000" required/></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="is_free" type="checkbox" className="w-4 h-4 accent-rose" defaultChecked={event.is_free}/>
            <span className="text-sm">This is a free event</span>
          </label>
        </ActionForm>
      </div>

      {/* Danger zone */}
      <div className="card card-body border-rose/30">
        <h2 className="font-bold text-rose mb-2">Danger Zone</h2>
        <p className="text-sm text-ink-3 mb-4">Deleting removes this event from the public listing. Existing registrations are kept on record, but attendees won't be automatically notified — let them know separately if you cancel.</p>
        <ActionButton
          action={deleteEvent.bind(null, event.id)}
          className="btn btn-outline text-rose border-rose"
          confirmMessage={`Delete "${event.title}"? This removes it from the public site immediately.`}
        >
          🗑 Delete Event
        </ActionButton>
      </div>
    </div>
  )
}
