'use client'
// @ts-nocheck
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SlotPicker from '@/components/booking/SlotPicker'
import { createBooking } from '@/lib/actions/bookings'

export default function BookingPage() {
  const sp = useSearchParams()
  const salonId   = sp.get('salon') || ''
  const serviceId = sp.get('service') || ''
  const [date, setDate]   = useState('')
  const [slot, setSlot]   = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const today = new Date(); today.setDate(today.getDate()+1)
  const minDate = today.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !slot) { setError('Please select a date and time slot.'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.set('salon_id', salonId); fd.set('service_id', serviceId)
    fd.set('date', date); fd.set('time_slot', slot); fd.set('notes', notes)
    const res = await createBooking(fd)
    if (res?.error) { setError(res.error); setLoading(false) }
  }

  return (
    <div className="container py-10 max-w-lg">
      <h1 className="text-2xl font-black mb-6">Book Appointment</h1>
      {error && <div className="alert-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="label">Select Date *</label><input type="date" className="input" min={minDate} value={date} onChange={e=>{setDate(e.target.value);setSlot('')}} required/></div>
        {date && <SlotPicker salonId={salonId} date={date} selected={slot} onSelect={setSlot}/>}
        <div><label className="label">Notes (optional)</label><textarea className="input" rows={3} placeholder="Any special requests…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        <button type="submit" disabled={!date||!slot||loading} className="btn btn-primary w-full justify-center text-base py-4 disabled:opacity-50">
          {loading?'Confirming…':slot?`Confirm ${date} at ${slot} →`:'Select a time slot'}
        </button>
      </form>
    </div>
  )
}