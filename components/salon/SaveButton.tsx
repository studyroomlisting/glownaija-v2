'use client'
import { useState, useTransition } from 'react'
import { saveSalon } from '@/lib/actions/salons'

export default function SaveButton({ salonId, initialSaved, className, iconOnly }: { salonId: string; initialSaved: boolean; className?: string; iconOnly?: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    if (iconOnly) { e.preventDefault(); e.stopPropagation() }
    startTransition(async () => {
      const result = await saveSalon(salonId)
      if (typeof result?.saved === 'boolean') setSaved(result.saved)
      else if (result?.error) window.location.href = '/auth/signin?next=/salon'
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} aria-label={saved ? 'Remove from saved' : 'Save salon'}
      className={className || 'btn btn-outline btn-sm'}>
      {iconOnly ? (saved ? '❤️' : '🤍') : (saved ? '❤️ Saved' : '🤍 Save')}
    </button>
  )
}
