'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ActionResult { error?: string; success?: boolean }

interface ActionFormProps {
  action: (formData: FormData) => Promise<ActionResult | void>
  children: React.ReactNode
  successMessage?: string
  className?: string
  submitLabel?: string
  submitClassName?: string
  resetOnSuccess?: boolean
}

/**
 * Wraps a <form> around a server action and actually shows the result.
 * Every dashboard form previously discarded the {error}/{success} a server
 * action returned, so submitting looked like it did nothing. This fixes that
 * everywhere it's used, and calls router.refresh() on success so anything
 * derived from fresh data (like the profile-completion %) updates immediately.
 */
export default function ActionForm({
  action, children, successMessage = 'Saved!', className, submitLabel, submitClassName, resetOnSuccess,
}: ActionFormProps) {
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        if (resetOnSuccess) formRef.current?.reset()
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className={className}>
      {children}

      {error && <div className="alert-error mt-3" role="alert">{error}</div>}
      {success && <div className="alert-success mt-3" role="status">✅ {successMessage}</div>}

      {submitLabel && (
        <button type="submit" disabled={pending} className={submitClassName || 'btn btn-primary w-full justify-center py-3.5 mt-4'}>
          {pending
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mr-2"/>Saving…</>
            : submitLabel}
        </button>
      )}
    </form>
  )
}
