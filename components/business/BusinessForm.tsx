'use client'
import { useState, useTransition } from 'react'
import { createSalon } from '@/lib/actions/salons'

interface BusinessFormProps {
  bTypes: string[]
  cities: string[]
}

export default function BusinessForm({ bTypes, cities }: BusinessFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createSalon(formData)
      // On success createSalon calls redirect() internally and never returns here.
      // We only ever reach this line on a validation/DB failure.
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="alert-error" role="alert">{error}</div>
      )}

      <div><label className="label">Salon Name *</label><input name="business_name" className="input" placeholder="e.g. Adaeze Natural Hair Studio" pattern="[A-Za-z][A-Za-z\s'.-]{1,79}" title="Letters only — no numbers or symbols" required/></div>
      <div><label className="label">Street Address *</label><input name="address" className="input" placeholder="e.g. 45 Rye Lane" maxLength={200} required/></div>
      <div><label className="label">Business Type *</label><select name="business_type" className="input">{bTypes.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">City *</label><select name="city" className="input">{cities.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Area / Neighbourhood *</label><input name="area" className="input" placeholder="e.g. Peckham" required/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Postcode *</label><input name="postcode" className="input" placeholder="SE15 5DT" style={{textTransform:'uppercase'}} pattern="[A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]?\s?[0-9][A-Za-z]{2}" title="Enter a valid UK postcode" required/></div>
        <div><label className="label">Phone *</label><input name="phone" type="tel" className="input" placeholder="+44 7700 900000" pattern="(\+44\s?|0)7\d{3}\s?\d{6}|(\+44\s?|0)[1-3]\d{2,4}\s?\d{5,6}" title="Enter a valid UK phone number" required/></div>
      </div>
      <div><label className="label">Contact Email *</label><input name="email" type="email" className="input" required/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Instagram</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">@</span><input name="instagram" className="input pl-7" placeholder="yoursalon"/></div></div>
        <div><label className="label">Website</label><input name="website" className="input" placeholder="https://yoursalon.co.uk"/></div>
      </div>
      <div><label className="label">Description <span className="font-normal text-ink-3">(recommended)</span></label><textarea name="description" className="input" rows={4} placeholder="Tell customers what makes you special — your experience, specialties, and approach…"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Years Experience</label><input name="years_active" type="number" className="input" min="0" max="50" defaultValue="0"/></div>
        <div><label className="label">Plan</label><select name="plan" className="input"><option value="starter">Starter — Free</option><option value="growth">Growth — £29/mo</option><option value="pro">Pro — £59/mo</option></select></div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer"><input name="accepts_online_bookings" type="checkbox" defaultChecked className="w-4 h-4"/><span className="text-sm">Accept online bookings via GlowNaija</span></label>

      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center text-base py-4">
        {pending
          ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Creating your listing…</>
          : 'List My Salon →'}
      </button>
    </form>
  )
}
