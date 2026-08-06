// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmtPrice } from '@/lib/utils'
export default async function OrderPage({ searchParams }: { searchParams: { ref?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: order } = await supabase.from('orders').select('*,order_items(*)').eq('reference',searchParams.ref||'...').eq('customer_id',user.id).single()
  if (!order) redirect('/account?tab=orders')
  return (
    <div className="container py-10 max-w-lg">
      <h1 className="text-2xl font-black mb-2">Order {order.reference}</h1>
      <span className="badge-pill bg-green-100 text-green-700 mb-6 inline-block">{order.status}</span>
      <div className="card card-body mb-4">
        {(order.order_items as any[]).map((item:any,i:number)=><div key={i} className="flex justify-between py-2.5 border-b border-bdr last:border-0"><span className="text-sm">{item.product_name} ×{item.quantity}</span><span className="font-bold text-sm">{fmtPrice(item.price_at_purchase*item.quantity)}</span></div>)}
        <div className="flex justify-between pt-3 text-sm text-ink-3"><span>Delivery</span><span>{fmtPrice(order.delivery_cost)}</span></div>
        <div className="flex justify-between pt-2 font-black text-lg border-t border-bdr mt-2"><span>Total</span><span>{fmtPrice(order.total)}</span></div>
      </div>
      <div className="card card-body text-sm text-ink-2"><p className="font-bold mb-2">Delivery Address</p><p>{order.full_name}</p><p>{order.address}</p><p>{order.city}, {order.postcode}</p></div>
    </div>
  )
}