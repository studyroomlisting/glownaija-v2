// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import { cancelBooking } from '@/lib/actions/bookings'
import ActionButton from '@/components/dashboard/ActionButton'

export default async function BookingConfirmationPage({ searchParams }: { searchParams: { ref?: string } }) {
  const supabase = await createClient()
  const { data: booking } = searchParams.ref
    ? await supabase.from('bookings')
        .select('*,salons(name,emoji,slug,images,area,city,rating),services(name,duration_minutes)')
        .eq('reference', searchParams.ref).single()
    : { data: null }

  if (!booking) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-black mb-2">Booking Not Found</h1>
        <p className="text-ink-3 mb-6">We couldn't find a booking with that reference.</p>
        <Link href="/salons" className="btn btn-primary">Find a Salon</Link>
      </div>
    )
  }

  const salon   = booking.salons as any
  const service = booking.services as any
  const unpaid  = !booking.deposit_paid && booking.status !== 'cancelled'
  const cancellable = ['pending', 'confirmed'].includes(booking.status)

  const statusMeta = {
    pending:   { icon: '⏳', title: 'Booking Request Received', color: 'bg-gold/10 text-gold' },
    confirmed: { icon: '✅', title: 'Booking Confirmed!',       color: 'bg-green-100 text-gn' },
    cancelled: { icon: '❌', title: 'Booking Cancelled',        color: 'bg-rose-100 text-rose' },
    completed: { icon: '🎉', title: 'Appointment Completed',    color: 'bg-green-100 text-gn' },
    no_show:   { icon: '⚠️', title: 'Marked as No-Show',        color: 'bg-page-2 text-ink-3' },
  }[booking.status] || { icon: '📅', title: 'Booking', color: 'bg-page-2 text-ink-3' }

  const bookingDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="container py-10 max-w-4xl">

      {/* Status hero */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full ${statusMeta.color} flex items-center justify-center text-3xl mx-auto mb-4`}>
          {statusMeta.icon}
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-2">{statusMeta.title}</h1>
        {unpaid && (
          <p className="text-ink-3 text-sm max-w-md mx-auto">Your slot is being held temporarily. Complete your deposit payment to confirm your booking.</p>
        )}
        {booking.status === 'confirmed' && (
          <p className="text-ink-3 text-sm">Your appointment at <strong>{salon?.name}</strong> is booked.</p>
        )}

        <div className="flex justify-center gap-6 flex-wrap mt-4 text-sm">
          <span className="text-ink-3">Booking ID: <strong className="text-ink">{booking.reference}</strong></span>
          <span className="text-ink-3">Booking Date: <strong className="text-ink">{bookingDate} · {booking.time_slot}</strong></span>
        </div>

        {cancellable && (
          <div className="mt-3">
            <ActionButton action={cancelBooking.bind(null, booking.id)} className="text-xs text-rose font-bold hover:underline" confirmMessage="Cancel this booking?">
              Cancel Booking
            </ActionButton>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-5">
          <div className="card card-body">
            <h2 className="font-bold mb-4">Your Booking Details</h2>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div><p className="text-2xs text-ink-3 uppercase tracking-wide">Salon</p><p className="font-semibold">{salon?.name}</p></div>
              <div><p className="text-2xs text-ink-3 uppercase tracking-wide">Service</p><p className="font-semibold">{service?.name || 'General appointment'}</p></div>
              <div><p className="text-2xs text-ink-3 uppercase tracking-wide">Date</p><p className="font-semibold">{bookingDate}</p></div>
              <div><p className="text-2xs text-ink-3 uppercase tracking-wide">Time</p><p className="font-semibold">{booking.time_slot}</p></div>
              <div><p className="text-2xs text-ink-3 uppercase tracking-wide">Status</p><p className="font-semibold capitalize">{booking.status.replace('_',' ')}</p></div>
              {booking.notes && <div className="col-span-2"><p className="text-2xs text-ink-3 uppercase tracking-wide">Notes</p><p className="font-semibold">{booking.notes}</p></div>}
            </div>
          </div>

          <div>
            <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-3">What's Next?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['💳', 'Payment', unpaid ? 'Complete your payment to confirm your booking.' : 'Your payment is all set.'],
                ['🏪', 'Visit the Salon', 'Show up at your booked time — no need to check in early.'],
                ['✨', 'Enjoy your Glow', 'Relax, and rate your experience afterwards.'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} className="card card-body text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-bold text-sm mb-1">{title}</p>
                  <p className="text-2xs text-ink-3">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="font-bold text-sm">Need help?</p>
              <p className="text-2xs text-ink-3">Call or email us if something's not right.</p>
            </div>
            <a href="mailto:hello@glownaija.co.uk" className="btn btn-outline btn-sm text-xs">✉ Email Support</a>
          </div>

          <div className="card card-body bg-ink text-white flex justify-between items-center flex-wrap gap-3">
            <p className="font-bold">Keep discovering, keep glowing! ✨</p>
            <Link href="/salons" className="btn bg-rose text-white hover:bg-rose-dark">Browse More Salons →</Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sticky top-20">
          <div className="card card-body">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-sm">Payment Summary</p>
              <span className="text-2xs text-gn font-bold">🔒 Secure Payment</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-3">Service</span><span>{service?.name || 'Appointment'}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Deposit</span><span>{fmtPrice(booking.deposit_amount)}</span></div>
              <div className="flex justify-between"><span className="text-ink-3">Platform fee</span><span>£0.00</span></div>
            </div>
            <div className="flex justify-between items-center bg-page-2 rounded-xl px-3 py-2.5 mt-3">
              <span className="font-bold text-sm">{unpaid ? 'Amount to pay' : 'Paid'}</span>
              <span className="font-black text-lg">{fmtPrice(booking.deposit_amount)}</span>
            </div>

            {unpaid ? (
              <Link href={`/api/pay-deposit?booking_id=${booking.id}`} className="btn btn-primary w-full justify-center mt-4">
                🔒 Proceed to Payment
              </Link>
            ) : (
              <div className="alert-success mt-4 text-center text-sm">✅ Deposit paid</div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-bdr text-2xs text-ink-3">
              <span>✅ Instant confirmation</span>
              <span>🔒 100% secure</span>
              <span>💷 No hidden fees</span>
            </div>
          </div>

          {salon && (
            <Link href={`/salon/${salon.slug}`} className="card block overflow-hidden group">
              <div className="relative h-24 bg-gradient-to-br from-ink to-purple-900">
                {salon.images?.[0]
                  ? <img src={salon.images[0]} alt={salon.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"/>
                  : <div className="absolute inset-0 flex items-center justify-center text-4xl">{salon.emoji}</div>}
              </div>
              <div className="p-3">
                <p className="font-bold text-sm">{salon.name}</p>
                <p className="text-2xs text-ink-3">📍 {salon.area}, {salon.city} · ★ {salon.rating || '—'}</p>
                <p className="text-2xs text-rose font-bold mt-1">View salon details →</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
