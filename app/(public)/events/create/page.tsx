// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createEvent } from '@/lib/actions/events'
import PageHero from '@/components/layout/PageHero'
import ActionForm from '@/components/dashboard/ActionForm'
import { ukDateString } from '@/lib/utils'

export default async function CreateEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/events/create')

  const cities = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other']
  const eventTypes = ['workshop','masterclass','meetup','popup','launch','conference']

  return (
    <>
      <PageHero title="Create an Event" subtitle="Host a workshop, masterclass, or meetup for the community"/>
      <div className="container py-8 max-w-xl">
        <div className="card card-body">
          <ActionForm action={createEvent} successMessage="Event created!" submitLabel="Create Event →" className="space-y-4">
            <div>
              <label className="label">Event Title *</label>
              <input name="title" className="input" minLength={3} maxLength={120} required/>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" className="input" rows={3} maxLength={1000}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Event Type</label>
                <select name="event_type" className="input">
                  {eventTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Icon</label>
                <select name="emoji" className="input text-lg">
                  {['🎉','💇🏾‍♀️','💅','💄','✂️','🧴','👑','🎓'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date *</label>
                <input name="event_date" type="date" className="input" min={ukDateString(new Date(Date.now() + 86400000))} required/>
              </div>
              <div>
                <label className="label">City *</label>
                <select name="city" className="input">{cities.map(c => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Start Time *</label><input name="time_start" type="time" className="input" required/></div>
              <div><label className="label">End Time *</label><input name="time_end" type="time" className="input" required/></div>
            </div>
            <div>
              <label className="label">Venue *</label>
              <input name="venue" className="input" required/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Price (£)</label><input name="price" type="number" className="input" defaultValue="0" min="0" step="0.01"/></div>
              <div><label className="label">Capacity *</label><input name="capacity" type="number" className="input" defaultValue="50" min="1" max="10000" required/></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="is_free" type="checkbox" className="w-4 h-4 accent-rose"/>
              <span className="text-sm">This is a free event</span>
            </label>
          </ActionForm>
        </div>
      </div>
    </>
  )
}
