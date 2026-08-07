'use client'

export default function NewsletterForm({ className, inputClassName, buttonClassName, buttonLabel = 'Subscribe' }: {
  className?: string; inputClassName?: string; buttonClassName?: string; buttonLabel?: string
}) {
  return (
    <form onSubmit={e => e.preventDefault()} className={className || 'flex gap-2 w-full sm:w-auto'}>
      <input type="email" required placeholder="Enter your email"
        className={inputClassName || 'input flex-1 sm:w-64 bg-white'} />
      <button type="submit" className={buttonClassName || 'btn btn-primary flex-shrink-0'}>
        {buttonLabel}
      </button>
    </form>
  )
}
