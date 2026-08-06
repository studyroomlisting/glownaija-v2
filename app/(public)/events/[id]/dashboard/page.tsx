// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
export default async function EventDashboardPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: event } = await supabase.from('events').select('*').eq('id',params.id).eq('organiser_id',user.id).single()
  if (!event) notFound()
  const { data: registrations } = await supabase.from('event_registrations').select('*').eq('event_id',params.id).order('created_at')
  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-2xl font-black mb-2">{event.title}</h1>
      <p className="text-ink-3 mb-6">{registrations?.length||0} / {event.capacity} registered</p>
      <div className="card card-body">
        <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Attendees</h2><a href={`/api/export-event?id=${params.id}`} className="btn btn-outline btn-sm">⬇ Export CSV</a></div>
        {!registrations?.length ? <p className="text-ink-3 text-sm text-center py-8">No registrations yet</p>
        : <div className="space-y-3">{registrations.map(r=><div key={r.id} className="flex justify-between py-3 border-b border-bdr last:border-0"><div><p className="font-semibold text-sm">{r.name}</p><p className="text-xs text-ink-3">{r.email}{r.phone?' · '+r.phone:''}</p></div><span className="text-xs text-ink-3">{r.tickets} ticket{r.tickets!==1?'s':''}</span></div>)}</div>}
      </div>
    </div>
  )
}