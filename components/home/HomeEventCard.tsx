import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'

export default function HomeEventCard({ event: e }: { event: any }) {
  const d = new Date(e.event_date)
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
  const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()

  return (
    <div className="card overflow-hidden">
      <Link href={`/events/${e.id}`} className="block relative h-48 bg-gradient-to-br from-ink to-purple-800 overflow-hidden">
        {e.image_url
          ? <img src={e.image_url} alt={e.title} className="w-full h-full object-cover opacity-90"/>
          : <div className="absolute inset-0 flex items-center justify-center text-6xl">{e.emoji}</div>
        }
        <span className={`absolute top-3 left-3 badge-pill text-2xs font-bold uppercase tracking-wide ${e.event_type === 'workshop' || e.event_type === 'masterclass' ? 'bg-purple-600 text-white' : 'bg-rose text-white'}`}>
          {e.event_type === 'workshop' || e.event_type === 'masterclass' ? e.event_type : 'Featured'}
        </span>
        <div className="absolute top-3 right-3 bg-white rounded-xl px-2.5 py-1.5 text-center leading-none shadow-sm">
          <p className="font-black text-base text-ink">{day}</p>
          <p className="text-3xs font-bold text-ink-3">{mon}</p>
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/events/${e.id}`}>
          <p className="font-black text-lg mb-2 hover:text-rose transition-colors">{e.title}</p>
        </Link>
        <p className="text-xs text-ink-3 flex items-center gap-1.5 mb-1">
          📅 {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {e.time_start?.substring(0,5)}
        </p>
        <p className="text-xs text-ink-3 flex items-center gap-1.5 mb-4">📍 {e.venue}, {e.city}</p>
        <div className="flex items-center justify-between">
          <span className="font-black text-lg">{e.is_free ? <span className="text-gn">Free</span> : fmtPrice(e.price)}</span>
          <Link href={`/events/${e.id}`} className="btn btn-primary btn-sm">Get Tickets</Link>
        </div>
      </div>
    </div>
  )
}
