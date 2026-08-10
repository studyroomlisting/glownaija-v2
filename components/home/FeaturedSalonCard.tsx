import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import SaveButton from '@/components/salon/SaveButton'

export default function FeaturedSalonCard({ salon, isSaved }: { salon: any; isSaved: boolean }) {
  const img = salon.images?.[0]
  return (
    <div className="card grid sm:grid-cols-[1.1fr_1fr] overflow-hidden">
      <div className="relative h-56 sm:h-auto">
        {img
          ? <img src={img} alt={salon.name} className="w-full h-full object-cover"/>
          : <div className="w-full h-full bg-gradient-to-br from-ink to-purple-900 flex items-center justify-center text-6xl">{salon.emoji}</div>
        }
        <span className="absolute top-3 left-3 badge-pill bg-white/95 text-ink text-xs font-bold">★ {salon.rating || '—'}</span>
        <SaveButton salonId={salon.id} initialSaved={isSaved} iconOnly
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-sm shadow-sm"/>
        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 flex-wrap">
          <span className={`badge-pill text-2xs ${salon.is_open ? 'bg-gn text-white' : 'bg-ink/70 text-white'}`}>● {salon.is_open ? 'Open Now' : 'Closed'}</span>
          {salon.service_types?.[0] && <span className="badge-pill bg-white/90 text-ink text-2xs capitalize">👥 {salon.service_types[0]}</span>}
        </div>
      </div>
      <div className="p-6 flex flex-col justify-center">
        <div className="flex justify-between items-start gap-3 mb-2">
          <div>
            <h3 className="font-black text-xl mb-1">{salon.name}</h3>
            <p className="text-xs text-ink-3 flex items-center gap-1">👥 Ladies, Unisex</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xs text-ink-3">From</p>
            <p className="font-black text-lg">{fmtPrice((salon.price_from || 0) * 100)}</p>
          </div>
        </div>
        <p className="text-xs text-ink-3 flex items-center gap-1 mb-2">📍 {salon.area}, {salon.city}</p>
        <p className="text-sm mb-5">
          <span className="text-gold">{'★'.repeat(Math.round(salon.rating || 0))}{'☆'.repeat(5 - Math.round(salon.rating || 0))}</span>
          <span className="text-ink-3 text-xs ml-1">({salon.review_count} reviews)</span>
        </p>
        <Link href={`/salon/${salon.slug}`} className="btn btn-primary w-fit">View Details →</Link>
      </div>
    </div>
  )
}
