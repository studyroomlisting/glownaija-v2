'use client'
import Link from 'next/link'
import { toggleFeatured, updateSalonStatus } from '@/lib/actions/admin'
import type { Salon } from '@/types/database'

export default function SalonRow({ salon }: { salon: Salon & { booking_count?: number } }) {
  return (
    <div className="card card-body flex justify-between items-center flex-wrap gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-sm">{salon.name}</span>
          {salon.is_featured && <span className="badge-pill bg-gold text-white text-2xs">★ Featured</span>}
          {salon.is_verified && <span className="badge-pill bg-gn text-white text-2xs">✓ Verified</span>}
          <span className="badge-pill bg-page-2 text-ink-3 text-2xs">{salon.plan}</span>
        </div>
        <p className="text-xs text-ink-3">📍 {salon.area}, {salon.city} {salon.postcode || ''} · ★{salon.rating} · {salon.review_count} reviews · {salon.booking_count || 0} bookings</p>
        {salon.email && <p className="text-xs text-ink-3">📧 {salon.email}</p>}
      </div>
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {salon.slug && <Link href={`/salon/${salon.slug}`} target="_blank" className="btn btn-outline btn-sm text-xs">👁 View</Link>}
        <form action={async () => { 'use server'; await toggleFeatured(salon.id, !salon.is_featured) }}>
          <button className={`btn btn-sm btn-outline text-xs ${salon.is_featured ? 'text-gold border-gold' : ''}`}>
            {salon.is_featured ? '★ Unfeature' : '★ Feature'}
          </button>
        </form>
        <form action={async () => { 'use server'; await updateSalonStatus(salon.id, salon.listing_status === 'approved' ? 'suspended' : 'approved') }}>
          <button className={`btn btn-sm text-xs ${salon.listing_status === 'approved' ? 'btn-outline text-rose border-rose' : 'btn-green'}`}>
            {salon.listing_status === 'approved' ? 'Suspend' : 'Restore'}
          </button>
        </form>
      </div>
    </div>
  )
}
