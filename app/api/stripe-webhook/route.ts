// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { generateRef } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const meta     = session.metadata || {}
    const supabase = await createAdminClient()

    if (meta.type === 'booking_deposit' && meta.booking_id) {
      await supabase.from('bookings').update({ deposit_paid: true, status: 'confirmed' }).eq('id', meta.booking_id)

      // Deposit paid confirmation email
      try {
        const { sendDepositPaidConfirmation, sendBookingStatusUpdate } = await import('@/lib/email')
        const { data: bk } = await supabase.from('bookings').select('*,salons(name,slug),profiles(first_name)').eq('id', meta.booking_id).single()
        if (bk) {
          const userAuth = await supabase.auth.admin.getUserById(bk.customer_id)
          const email = userAuth.data.user?.email
          if (email) {
            await sendDepositPaidConfirmation({
              email, firstName: (bk.profiles as any)?.first_name || 'there',
              salonName: (bk.salons as any)?.name, reference: bk.reference,
              date: bk.booking_date, timeSlot: bk.time_slot, depositAmount: bk.deposit_amount,
            })
          }
        }
      } catch {}
    }

    if (meta.type === 'shop' && meta.customer_id && meta.items_json) {
      const items = JSON.parse(meta.items_json)
      const total = session.amount_total || 0
      const ref   = generateRef('GNO')

      const { data: order } = await supabase.from('orders').insert({
        customer_id: meta.customer_id, reference: ref,
        status: 'confirmed', total,
        delivery_cost: parseInt(meta.delivery_cost || '299'),
        full_name: meta.full_name, address: meta.address,
        city: meta.city, postcode: meta.postcode,
        stripe_session_id: session.id,
      }).select().single()

      if (order) {
        // Order confirmation email
        try {
          const { sendOrderConfirmation } = await import('@/lib/email')
          const userAuth = await supabase.auth.admin.getUserById(meta.customer_id)
          const email = userAuth.data.user?.email
          if (email) {
            await sendOrderConfirmation({
              email, firstName: meta.full_name?.split(' ')[0] || 'there',
              reference: ref, items, total, deliveryCost: parseInt(meta.delivery_cost||'299'),
              address: meta.address, city: meta.city, postcode: meta.postcode,
            })
          }
        } catch {}

        await supabase.from('order_items').insert(
          items.map((item: any) => ({
            order_id: order.id, product_id: item.id,
            product_name: item.name, price_at_purchase: item.price,
            quantity: item.quantity,
          }))
        )
        // Decrement stock
        for (const item of items) {
          await supabase.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity }).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
