// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { fmtPrice } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { items, full_name, address, city, postcode, delivery_cost = 299, coupon_id } = body

  if (!items?.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

  const line_items = items.map((item: any) => ({
    price_data: {
      currency: 'gbp',
      product_data: { name: `${item.name} by ${item.brand || ''}` },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }))
  line_items.push({ price_data: { currency: 'gbp', product_data: { name: 'Delivery' }, unit_amount: delivery_cost }, quantity: 1 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=orders&order_placed=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    metadata: {
      type: 'shop', customer_id: user?.id || '',
      full_name, address, city, postcode,
      delivery_cost: String(delivery_cost),
      items_json: JSON.stringify(items),
      coupon_id: coupon_id || '',
    },
  })

  return NextResponse.json({ url: session.url })
}
