'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ActionResult { error?: string; success?: boolean }

interface ActionButtonProps {
  action: () => Promise<ActionResult | void>
  children: React.ReactNode
  className?: string
  confirmMessage?: string
}

/** A single button that calls a server action, shows an error inline if it fails, and refreshes on success. */
export default function ActionButton({ action, children, className, confirmMessage }: ActionButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (confirmMessage && !confirm(confirmMessage)) return
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? '…' : children}
      </button>
      {error && <span className="text-2xs text-rose font-semibold">{error}</span>}
    </span>
  )
}
