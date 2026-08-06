import Link from 'next/link'
import Image from 'next/image'
import { fmtPrice } from '@/lib/utils'
import type { Salon } from '@/types/database'

interface SalonCardProps {
  salon: Salon & { saved?: boolean }
  onSave?: (id: string) => void
}

export default function SalonCard({ salon, onSave }: SalonCardProps) {
  const img = salon.images?.[0]
  return (
    <div className="card group">
      <Link href={`/salon/${salon.slug}`}>
        <div className="relative h-44 bg-gradient-to-br from-ink to-purple-900 overflow-hidden">
          {img ? (
            <Image src={img} alt={salon.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">{salon.emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 flex gap-1.5 flex-wrap">
            {salon.is_verified && <span className="badge-pill bg-gn/90 text-white text-2xs">✓ Verified</span>}
            {salon.is_featured && <span className="badge-pill bg-gold/90 text-white text-2xs">★ Featured</span>}
            <span className={`badge-pill text-2xs text-white ${salon.is_open ? 'bg-gn/90' : 'bg-black/50'}`}>
              {salon.is_open ? '● Open' : '● Closed'}
            </span>
          </div>
          {onSave && (
            <button onClick={e => { e.preventDefault(); onSave(salon.id) }}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all text-base">
              {salon.saved ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </Link>
      <Link href={`/salon/${salon.slug}`} className="block p-4">
        <h3 className="font-bold text-ink mb-0.5 truncate">{salon.name}</h3>
        <p className="text-xs text-ink-3 mb-2">📍 {salon.area}, {salon.city}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-3 font-semibold">
            {salon.rating > 0 ? `★ ${salon.rating} (${salon.review_count})` : '⭐ New'}
          </span>
          {salon.price_from > 0 && <span className="text-xs text-ink-3">From <strong className="text-ink">{fmtPrice(salon.price_from * 100)}</strong></span>}
        </div>
      </Link>
    </div>
  )
}
