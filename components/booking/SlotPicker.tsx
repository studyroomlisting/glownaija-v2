'use client'
import { useState, useEffect } from 'react'
import { cn, ukDateString, ukTimeString } from '@/lib/utils'

interface SlotPickerProps {
  salonId: string
  date: string
  onSelect: (slot: string) => void
  selected?: string
}

export default function SlotPicker({ salonId, date, onSelect, selected }: SlotPickerProps) {
  const [slots,  setSlots]  = useState<string[]>([])
  const [taken,  setTaken]  = useState<string[]>([])
  const [closed, setClosed] = useState(false)
  const [loading,setLoading]= useState(false)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [now,    setNow]    = useState(() => new Date())

  // Re-check the clock every 30s so a slot that just passed greys out live,
  // without needing the user to touch anything or reload the page.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const isToday = date === ukDateString(now)
  const nowHHMM = ukTimeString(now)

  useEffect(() => {
    if (!salonId || !date) return
    setLoading(true)
    setLoadError(false)
    fetch(`/api/availability?salon_id=${salonId}&date=${date}`)
      .then(r => r.json())
      .then(d => {
        setClosed(d.is_closed)
        setSlots(d.all_slots || [])
        setTaken(d.taken_slots || [])
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }, [salonId, date, retryKey])

  if (loading) return <div className="text-center py-6 text-ink-3 text-sm">Loading availability…</div>
  if (loadError) return (
    <div className="text-center py-6 text-ink-3 bg-page-2 rounded-xl">
      <p className="text-2xl mb-2">⚠️</p>
      <p className="font-semibold mb-2">Could not load availability</p>
      <button type="button" onClick={() => setRetryKey(k => k + 1)} className="btn btn-outline btn-sm text-xs">Try again</button>
    </div>
  )
  if (closed)  return <div className="text-center py-6 text-ink-3 bg-page-2 rounded-xl"><p className="text-2xl mb-2">🚫</p><p className="font-semibold">Closed on this day</p></div>
  const futureSlots = isToday ? slots.filter(s => s > nowHHMM) : slots
  if (!slots.length || (isToday && !futureSlots.length)) return <div className="text-center py-6 text-ink-3 bg-page-2 rounded-xl"><p>No availability on this date</p></div>

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-3 mb-2">Available Slots</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {slots.map(slot => {
          const isPast = isToday && slot <= nowHHMM
          const isTaken = taken.includes(slot)
          const isDisabled = isTaken || isPast
          const isSelected = selected === slot
          return (
            <button key={slot} disabled={isDisabled} onClick={() => onSelect(slot)}
              title={isPast ? 'This time has already passed' : isTaken ? 'Already booked' : undefined}
              className={cn('py-2 text-xs font-bold rounded-lg border-2 transition-all',
                isDisabled  ? 'border-bdr text-ink-3/40 bg-page-2 cursor-not-allowed line-through' :
                isSelected ? 'border-rose bg-rose text-white' :
                             'border-bdr hover:border-rose hover:text-rose')}>
              {slot}
            </button>
          )
        })}
      </div>
    </div>
  )
}
