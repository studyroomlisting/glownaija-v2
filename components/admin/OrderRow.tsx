'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { fmtPrice } from '@/lib/utils'
import { updateOrderStatus } from '@/lib/actions/admin'
import type { Order } from '@/types/database'

interface OrderRowProps {
  order: Order & { profiles?: { first_name: string; last_name: string; email?: string } | null }
}

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrderRow({ order }: OrderRowProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(status: string) {
    startTransition(async () => {
      await updateOrderStatus(order.id, status)
      router.refresh()
    })
  }

  return (
    <div className="card card-body flex justify-between items-center flex-wrap gap-3">
      <div>
        <p className="font-bold text-sm">{order.reference}</p>
        <p className="text-xs text-ink-3">{order.profiles?.first_name} {order.profiles?.last_name} · {new Date(order.created_at).toLocaleDateString('en-GB')}</p>
      </div>
      <div className="text-right flex items-center gap-3">
        <p className="font-black">{fmtPrice(order.total)}</p>
        <select
          defaultValue={order.status}
          disabled={pending}
          onChange={e => handleChange(e.target.value)}
          className={`status status-${order.status} border-none text-xs font-bold cursor-pointer`}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}
