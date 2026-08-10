import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import SaveButton from '@/components/salon/SaveButton'

export default function FeaturedSalonCard({ salon, isSaved }: { salon: any; isSaved: boolean }) {
  const img = salon.images?.[0]

  return (
    <div className="card overflow-hidden">
      <Link href={`/salon/${salon.slug}`} className="block relative h-48 bg-gradient-to-br from-ink to-purple-800 overflow-hidden">
        {img
          ? <img src={img} alt={salon.name} className="w-full h-full object-cover opacity-90"/>
          : <div className="absolute inset-0 flex items-center justify-center text-6xl">{salon.emoji}</div>
        }
        <span className="absolute top-3 left-3 badge-pill bg-gold text-white text-2xs font-bold uppercase tracking-wide">Featured</span>
        <div className="absolute top-3 right-3 bg-white rounded-xl px-2.5 py-1.5 text-center leading-none shadow-sm">
          <p className="font-black text-base text-ink">★ {salon.rating || '—'}</p>
          <p className="text-3xs font-bold text-ink-3">{salon.review_count} revs</p>
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/salon/${salon.slug}`}>
            <p className="font-black text-lg hover:text-rose transition-colors">{salon.name}</p>
          </Link>
          <SaveButton salonId={salon.id} initialSaved={isSaved} iconOnly
            className="w-8 h-8 rounded-full bg-page-2 flex items-center justify-center text-sm flex-shrink-0"/>
        </div>
        <p className="text-xs text-ink-3 flex items-center gap-1.5 mb-1">
          {salon.is_open ? '● Open Now' : '● Closed'} · 👥 Ladies, Unisex
        </p>
        <p className="text-xs text-ink-3 flex items-center gap-1.5 mb-4">📍 {salon.area}, {salon.city}</p>
        <div className="flex items-center justify-between">
          <span className="font-black text-lg">From {fmtPrice((salon.price_from || 0) * 100)}</span>
          <Link href={`/salon/${salon.slug}`} className="btn btn-primary btn-sm">View Details</Link>
        </div>
      </div>
    </div>
  )
}
