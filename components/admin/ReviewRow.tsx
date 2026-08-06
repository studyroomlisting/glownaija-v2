'use client'
import { deleteReview } from '@/lib/actions/admin'
import ActionButton from '@/components/dashboard/ActionButton'
import type { Review } from '@/types/database'

interface ReviewRowProps {
  review: Review & { profiles?: { first_name: string; last_name: string } | null; salons?: { name: string } | null }
}

export default function ReviewRow({ review }: ReviewRowProps) {
  return (
    <div className="card card-body">
      <div className="flex justify-between items-start mb-2 gap-3 flex-wrap">
        <div>
          <p className="font-bold text-sm">{review.profiles?.first_name} {review.profiles?.last_name} on {review.salons?.name}</p>
          <p className="text-xs text-ink-3">{new Date(review.created_at).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-gold">{'★'.repeat(review.rating)}</div>
          <ActionButton action={() => deleteReview(review.id, review.salon_id)} className="btn btn-outline btn-sm text-xs text-rose border-rose/50" confirmMessage="Delete this review permanently?">
            Delete
          </ActionButton>
        </div>
      </div>
      <p className="text-sm text-ink-2">{review.review_text}</p>
    </div>
  )
}
