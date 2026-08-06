// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createEvent } from '@/lib/actions/events'
import PageHero from '@/components/layout/PageHero'
export default async function CreateEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/events/create')
  const cities = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other']
  return (<><PageHero title="Create an Event"/><div className="container py-8 max-w-xl"><div className="card card-body"><form action={createEvent} className="space-y-4"><input type="hidden" name="organiser_id" value={user.id}/><div><label className="label">Event Title *</label><input name="title" className="input" required/></div><div><label className="label">Description</label><textarea name="description" className="input" rows={3}/></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Date *</label><input name="event_date" type="date" className="input" required/></div><div><label className="label">City *</label><select name="city" className="input">{cities.map(c=><option key={c}>{c}</option>)}</select></div></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Start Time *</label><input name="time_start" type="time" className="input" required/></div><div><label className="label">End Time *</label><input name="time_end" type="time" className="input" required/></div></div><div><label className="label">Venue *</label><input name="venue" className="input" required/></div><div className="grid grid-cols-2 gap-3"><div><label className="label">Price (£)</label><input name="price" type="number" className="input" defaultValue="0" min="0"/></div><div><label className="label">Capacity</label><input name="capacity" type="number" className="input" defaultValue="50"/></div></div><label className="flex items-center gap-2"><input name="is_free" type="checkbox" className="w-4 h-4"/><span className="text-sm">This is a free event</span></label><button type="submit" className="btn btn-primary w-full justify-center">Create Event →</button></form></div></div></>)
}