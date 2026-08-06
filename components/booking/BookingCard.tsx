import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { Booking } from '@/types/database'
import { fmtPrice } from '@/lib/utils'

type BookingWithExtra = Booking & { sname?: string; sslug?: string; semoji?: string; svname?: string }

export default function BookingCard({ booking, onCancel }: { booking: BookingWithExtra; onCancel?: (id: string) => void }) {
  const statusVariants: Record<string, 'green'|'gold'|'blue'|'gray'|'rose'> = {
    confirmed: 'green', pending: 'gold', completed: 'blue', cancelled: 'gray', no_show: 'rose'
  }
  return (
    <div className="card card-body">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span>{booking.semoji}</span>
            <Link href={`/salon/${booking.sslug}`} className="font-bold text-ink hover:text-rose">{booking.sname}</Link>
          </div>
          <p className="text-sm text-ink-2">{booking.svname || 'Appointment'}</p>
          <p className="text-sm text-ink-3">{new Date(booking.booking_date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })} at {booking.time_slot}</p>
          <p className="text-xs text-ink-3 mt-1">Ref: <strong>{booking.reference}</strong> · {booking.deposit_paid ? <span className="text-gn">✓ Deposit {fmtPrice(booking.deposit_amount)} paid</span> : <span className="text-gold">⏳ Deposit pending</span>}</p>
        </div>
        <Badge variant={statusVariants[booking.status] || 'gray'}>{booking.status.replace('_',' ')}</Badge>
      </div>
      {['pending','confirmed'].includes(booking.status) && !booking.deposit_paid && onCancel && (
        <div className="flex gap-2 pt-3 border-t border-bdr">
          <Link href={`/api/pay-deposit?booking_id=${booking.id}`} className="btn btn-primary btn-sm">Pay Deposit {fmtPrice(booking.deposit_amount)} →</Link>
          <button onClick={() => onCancel(booking.id)} className="btn btn-outline btn-sm text-rose border-rose/50 hover:border-rose">Cancel</button>
        </div>
      )}
    </div>
  )
}
