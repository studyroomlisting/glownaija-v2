'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SlotPicker from '@/components/booking/SlotPicker'
import { createBooking } from '@/lib/actions/bookings'
import { fmtPrice, formatDuration } from '@/lib/utils'

export default function BookingPage() {
  const sp = useSearchParams()
  const salonId = sp.get('salon') || ''
  const preselectedServiceId = sp.get('service') || ''

  const [salon, setSalon]       = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loadingInfo, setLoadingInfo] = useState(true)

  const [serviceId, setServiceId] = useState(preselectedServiceId)
  const [date, setDate]   = useState('')
  const [slot, setSlot]   = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const today = new Date(); today.setDate(today.getDate() + 1)
  const minDate = today.toISOString().split('T')[0]

  useEffect(() => {
    if (!salonId) { setLoadingInfo(false); return }
    const supabase = createClient()
    Promise.all([
      supabase.from('salons').select('id,name,emoji,area,city,rating,review_count,images,slug').eq('id', salonId).single(),
      supabase.from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('sort_order'),
    ]).then((results: any[]) => {
      const s = results[0]?.data
      const svcs = results[1]?.data
      setSalon(s)
      setServices(svcs || [])
      if (!preselectedServiceId && svcs?.length) setServiceId(svcs[0].id)
      setLoadingInfo(false)
    })
  }, [salonId])

  const selectedService = services.find(s => s.id === serviceId)
  const price   = selectedService?.price || 0
  const deposit = price ? Math.round(price * 0.25) : 0

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
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-ink-3 mb-3">
        <Link href="/salons" className="hover:text-rose">Salons</Link>
        {salon && <> / <Link href={`/salon/${salon.slug}`} className="hover:text-rose">{salon.name}</Link></>} / <span className="text-ink-2 font-medium">Book</span>
      </div>

      <h1 className="text-2xl font-black mb-1">Book {salon ? `an appointment at ${salon.name}` : 'Appointment'}</h1>
      <p className="text-ink-3 text-sm mb-5">Choose a service and pick a time that works for you.</p>

      {/* Trust row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-2xs text-ink-3">
        <span>✅ Instant confirmation</span>
        <span>🔒 Secure payment</span>
        <span>💷 No hidden charges</span>
        <span>↩️ Easy cancellation</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Main column */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="alert-error">{error}</div>}

          {/* Step 1 — Choose service */}
          <div className="card card-body">
            <p className="font-bold text-sm mb-3">1. Choose service</p>
            {loadingInfo ? (
              <p className="text-sm text-ink-3">Loading services…</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-ink-3">This salon hasn't added services yet — you can still request a general appointment.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map(s => (
                  <button key={s.id} type="button" onClick={() => setServiceId(s.id)}
                    className={`px-4 py-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${serviceId === s.id ? 'border-rose bg-rose-50 text-rose' : 'border-bdr hover:border-rose/50'}`}>
                    <span className="block">{s.emoji} {s.name} {serviceId === s.id && '✓'}</span>
                    <span className="block font-normal text-ink-3 mt-0.5">{formatDuration(s.duration_minutes)} · {fmtPrice(s.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Select date */}
          <div className="card card-body">
            <p className="font-bold text-sm mb-3">2. Select start date</p>
            <input type="date" className="input" min={minDate} value={date}
              onChange={e => { setDate(e.target.value); setSlot('') }} required/>
            <p className="text-2xs text-ink-3 mt-2">You can cancel or modify your booking anytime before it's confirmed.</p>
          </div>

          {/* Step 3 — Select time */}
          {date && (
            <div className="card card-body">
              <p className="font-bold text-sm mb-3">3. Select start time</p>
              <SlotPicker salonId={salonId} date={date} selected={slot} onSelect={setSlot}/>
            </div>
          )}

          {/* Notes */}
          <div className="card card-body">
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={3} placeholder="Any special requests…" value={notes} onChange={e => setNotes(e.target.value)}/>
          </div>

          <div className="card card-body bg-page-2 border-0">
            <p className="text-xs font-bold mb-1">Need help?</p>
            <p className="text-xs text-ink-3">Message the salon directly via the enquiry form on their listing, or call them if a phone number is listed.</p>
          </div>

          <button type="submit" disabled={!date || !slot || loading}
            className="btn btn-primary w-full justify-center text-base py-4 disabled:opacity-50 lg:hidden">
            {loading ? 'Confirming…' : slot ? `Confirm ${date} at ${slot} →` : 'Select a time slot'}
          </button>
        </form>

        {/* Sidebar — booking summary */}
        <div className="card overflow-hidden sticky top-20">
          <div className="relative h-32 bg-gradient-to-br from-ink to-purple-900">
            {salon?.images?.[0]
              ? <img src={salon.images[0]} alt={salon.name} className="w-full h-full object-cover opacity-80"/>
              : <div className="absolute inset-0 flex items-center justify-center text-5xl">{salon?.emoji || '💇'}</div>}
            {salon && (
              <span className="absolute top-2 right-2 badge-pill bg-white/90 text-ink text-2xs">★ {salon.rating || '—'}</span>
            )}
          </div>
          <div className="card-body">
            <p className="font-bold">{salon?.name || 'Salon'}</p>
            {salon && <p className="text-xs text-ink-3 mb-4">📍 {salon.area}, {salon.city}</p>}

            <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-2 mt-2">Booking Summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-3">Service</span><span className="font-semibold">{selectedService?.name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Duration</span><span className="font-semibold">{selectedService ? formatDuration(selectedService.duration_minutes) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Date</span><span className="font-semibold">{date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Time</span><span className="font-semibold">{slot || '—'}</span></div>
            </div>

            <div className="border-t border-bdr mt-3 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-3">Service price</span><span>{fmtPrice(price)}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Deposit due now (25%)</span><span>{fmtPrice(deposit)}</span></div>
            </div>
            <div className="flex justify-between items-center bg-page-2 rounded-xl px-3 py-2.5 mt-3">
              <span className="font-bold text-sm">Due at booking</span>
              <span className="font-black text-lg">{fmtPrice(deposit)}</span>
            </div>
            <p className="text-2xs text-ink-3 mt-2">🔒 Secured checkout · balance paid at the salon</p>

            <button type="button" onClick={handleSubmit} disabled={!date || !slot || loading}
              className="hidden lg:flex btn btn-primary w-full justify-center text-sm py-3.5 mt-4 disabled:opacity-50">
              {loading ? 'Confirming…' : 'Confirm Booking →'}
            </button>
            <p className="text-2xs text-ink-3 mt-3 text-center">Free cancellation until the salon confirms your booking</p>
          </div>
        </div>
      </div>
    </div>
  )
}
