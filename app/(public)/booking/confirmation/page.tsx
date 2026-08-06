// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export default async function BookingConfirmationPage({ searchParams }: { searchParams: { ref?: string } }) {
  const supabase = await createClient()
  const { data: booking } = searchParams.ref
    ? await supabase.from('bookings').select('*,salons(name,emoji,slug)').eq('reference',searchParams.ref).single()
    : { data: null }
  return (
    <div className="container py-16 max-w-lg text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h1 className="text-3xl font-black mb-3">Booking Confirmed!</h1>
      {booking && <>
        <p className="text-ink-3 mb-2">Your appointment at <strong>{(booking.salons as any)?.name}</strong> is booked.</p>
        <p className="text-ink-3 mb-1">📅 {booking.booking_date} at {booking.time_slot}</p>
        <p className="text-ink-3 mb-6">Ref: <strong>{booking.reference}</strong></p>
        {!booking.deposit_paid && <div className="card card-body mb-6"><p className="font-bold mb-3">Pay deposit to confirm your slot</p><Link href={`/api/pay-deposit?booking_id=${booking.id}`} className="btn btn-primary w-full justify-center">Pay Deposit Now →</Link></div>}
      </>}
      <div className="flex gap-3 justify-center"><Link href="/account?tab=bookings" className="btn btn-primary">View My Bookings</Link><Link href="/salons" className="btn btn-outline">Find Another Salon</Link></div>
    </div>
  )
}