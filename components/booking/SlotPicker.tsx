'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    if (!salonId || !date) return
    setLoading(true)
    fetch(`/api/availability?salon_id=${salonId}&date=${date}`)
      .then(r => r.json())
      .then(d => {
        setClosed(d.is_closed)
        setSlots(d.all_slots || [])
        setTaken(d.taken_slots || [])
        setLoading(false)
      })
  }, [salonId, date])

  if (loading) return <div className="text-center py-6 text-ink-3 text-sm">Loading availability…</div>
  if (closed)  return <div className="text-center py-6 text-ink-3 bg-page-2 rounded-xl"><p className="text-2xl mb-2">🚫</p><p className="font-semibold">Closed on this day</p></div>
  if (!slots.length) return <div className="text-center py-6 text-ink-3 bg-page-2 rounded-xl"><p>No availability on this date</p></div>

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-3 mb-2">Available Slots</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {slots.map(slot => {
          const isTaken = taken.includes(slot)
          const isSelected = selected === slot
          return (
            <button key={slot} disabled={isTaken} onClick={() => onSelect(slot)}
              className={cn('py-2 text-xs font-bold rounded-lg border-2 transition-all',
                isTaken    ? 'border-bdr text-ink-3/40 bg-page-2 cursor-not-allowed line-through' :
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
