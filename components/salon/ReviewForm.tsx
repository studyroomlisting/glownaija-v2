'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/salons'

export default function ReviewForm({ salonId, slug, loggedIn }: { salonId: string; slug: string; loggedIn: boolean }) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (!loggedIn) {
    return (
      <div className="bg-page-2 rounded-xl p-4 text-center">
        <p className="text-sm text-ink-3 mb-2">Sign in to leave a review for this salon.</p>
        <a href={`/auth/signin?next=/salon/${slug}`} className="btn btn-outline btn-sm">Sign In →</a>
      </div>
    )
  }

  if (success) {
    return <div className="alert-success">✅ Thanks! Your review has been posted.</div>
  }

  function handleSubmit(formData: FormData) {
    if (rating < 1) { setError('Please select a star rating.'); return }
    setError(null)
    formData.set('rating', String(rating))
    formData.set('salon_id', salonId)
    formData.set('slug', slug)
    startTransition(async () => {
      const result = await submitReview(formData)
      if (result?.error) setError(result.error)
      else { setSuccess(true); router.refresh() }
    })
  }

  return (
    <form action={handleSubmit} className="bg-page-2 rounded-xl p-4 space-y-3">
      <p className="font-bold text-sm">Leave a Review</p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className="text-2xl leading-none transition-transform hover:scale-110">
            <span style={{ color: (hover || rating) >= star ? '#D4AF37' : '#E8E0D8' }}>★</span>
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-ink-3 ml-2">{rating}/5</span>}
      </div>

      <textarea name="review_text" className="input bg-white" rows={3} maxLength={1000}
        placeholder="Share your experience (min 10 characters)…" required minLength={10}/>

      <div className="grid grid-cols-2 gap-2">
        <input name="service_booked" className="input bg-white text-xs" placeholder="Service booked (optional)"/>
        <select name="hair_type" className="input bg-white text-xs" defaultValue="">
          <option value="">Hair type (optional)</option>
          {['4C','4B','4A','3C','3B','Wig/Weave','Mixed','Relaxed','Other'].map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {error && <div className="alert-error text-xs">{error}</div>}

      <button type="submit" disabled={pending} className="btn btn-primary btn-sm w-full justify-center disabled:opacity-50">
        {pending ? 'Posting…' : 'Post Review →'}
      </button>
    </form>
  )
}
