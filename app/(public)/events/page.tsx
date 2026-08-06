// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PageHero from '@/components/layout/PageHero'
import { fmtPrice } from '@/lib/utils'
export default async function EventsPage({ searchParams }: { searchParams: { city?: string; type?: string } }) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  let q = supabase.from('events').select('*').eq('is_active',true).gte('event_date',today).order('event_date')
  if (searchParams.city) q = q.eq('city', searchParams.city)
  if (searchParams.type) q = q.eq('event_type', searchParams.type)
  const { data: events } = await q.limit(20)
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <PageHero title="Events & Workshops" subtitle="Nigerian and Afro-Caribbean beauty events across the UK">
        <div className="flex justify-end mb-3">{user && <Link href="/events/create" className="btn bg-rose text-white btn-sm">+ Create Event</Link>}</div>
      </PageHero>
      <div className="container py-8">
        {!events?.length ? <div className="text-center py-16 text-ink-3"><div className="text-5xl mb-4">🎉</div><p className="font-bold">No upcoming events</p></div>
        : <div className="grid-3">{events.map(e=>(
          <Link key={e.id} href={`/events/${e.id}`} className="card">
            <div className="h-36 bg-gradient-to-br from-ink to-purple-800 relative overflow-hidden">
              {e.image_url ? <img src={e.image_url} className="w-full h-full object-cover opacity-80"/> : <div className="absolute inset-0 flex items-center justify-center text-5xl">{e.emoji}</div>}
            </div>
            <div className="p-4">
              <p className="font-black text-sm mb-1 line-clamp-2">{e.title}</p>
              <p className="text-xs text-ink-3 mb-1">📅 {new Date(e.event_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})} · {e.time_start?.substring(0,5)}</p>
              <p className="text-xs text-ink-3 mb-2">📍 {e.venue}, {e.city}</p>
              <div className="flex justify-between items-center">
                <span className="font-black text-sm">{e.is_free?<span className="text-gn">Free</span>:fmtPrice(e.price)}</span>
                <span className="text-xs text-ink-3">{e.rsvp_count}/{e.capacity}</span>
              </div>
            </div>
          </Link>
        ))}</div>}
      </div>
    </>
  )
}