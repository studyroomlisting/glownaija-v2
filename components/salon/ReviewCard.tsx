import StarRating from './StarRating'
import type { Review } from '@/types/database'

interface ReviewCardProps {
  review: Review & { first_name?: string; last_name?: string }
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const initials = (review.first_name?.[0] || '?').toUpperCase()
  const name = `${review.first_name || 'Customer'} ${(review.last_name?.[0] || '')}${review.last_name ? '.' : ''}`
  const date = new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="py-4 border-b border-bdr last:border-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose to-gold flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{initials}</div>
          <div>
            <p className="font-bold text-sm">{name}</p>
            <p className="text-xs text-ink-3">{date}{review.is_verified && ' · ✓ Verified'}</p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>
      {review.service_booked && <p className="text-xs font-bold text-rose mb-1">✂️ {review.service_booked}</p>}
      <p className="text-sm text-ink-2 leading-relaxed">{review.review_text}</p>
    </div>
  )
}
