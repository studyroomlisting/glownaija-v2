'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentCountdown({ createdAt }: { createdAt: string }) {
  const router = useRouter()
  const deadline = new Date(createdAt).getTime() + 15 * 60 * 1000
  const [msLeft, setMsLeft] = useState(() => Math.max(0, deadline - Date.now()))

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, deadline - Date.now())
      setMsLeft(left)
      if (left <= 0) router.refresh()
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline, router])

  const totalSeconds = Math.ceil(msLeft / 1000)
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  const urgent = totalSeconds <= 5 * 60

  if (totalSeconds <= 0) {
    return <p className="text-xs font-bold mt-2 text-rose">⏱ Time's up — this booking is being released…</p>
  }

  return (
    <p className={`text-xs font-bold mt-2 ${urgent ? 'text-rose' : 'text-gold'}`}>
      ⏱ Pay within <span className="font-mono text-sm">{mm}:{ss}</span> or this booking will be automatically released.
    </p>
  )
}
