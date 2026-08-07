'use client'
import { useState, useTransition } from 'react'
import { saveSalon } from '@/lib/actions/salons'

export default function SaveButton({ salonId, initialSaved, className }: { salonId: string; initialSaved: boolean; className?: string }) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await saveSalon(salonId)
      if (typeof result?.saved === 'boolean') setSaved(result.saved)
      else if (result?.error) window.location.href = '/auth/signin?next=/salon'
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending}
      className={className || 'btn btn-outline btn-sm'}>
      {saved ? '❤️ Saved' : '🤍 Save'}
    </button>
  )
}
