// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { fmtPrice, isValidUKPostcode, isValidName } from '@/lib/utils'

let stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  return stripe
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { items, full_name, address, city, postcode, delivery_cost = 299, coupon_id } = body

  if (!items?.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
  if (!isValidName((full_name || '').trim())) return NextResponse.json({ error: 'Please enter a valid full name.' }, { status: 400 })
  if (!address || !String(address).trim())     return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  if (!city || !String(city).trim())            return NextResponse.json({ error: 'City is required.' }, { status: 400 })
  if (!isValidUKPostcode((postcode || '').trim())) return NextResponse.json({ error: 'Please enter a valid UK postcode.' }, { status: 400 })

  // Re-check stock against the live database — the cart's client-side stock cap can be
  // bypassed (devtools/localStorage), and stock may have changed since items were added.
  const ids = items.map((i: any) => i.id)
  const { data: liveProducts } = await supabase.from('products').select('id,name,stock_count,is_active').in('id', ids)
  for (const item of items) {
    const live = liveProducts?.find(p => p.id === item.id)
    if (!live || !live.is_active) return NextResponse.json({ error: `${item.name} is no longer available.` }, { status: 400 })
    if (item.quantity > live.stock_count) {
      return NextResponse.json({ error: `Only ${live.stock_count} of "${live.name}" left in stock. Please update your cart.` }, { status: 400 })
    }
  }

  const line_items = items.map((item: any) => ({
    price_data: {
      currency: 'gbp',
      product_data: { name: `${item.name} by ${item.brand || ''}` },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }))
  line_items.push({ price_data: { currency: 'gbp', product_data: { name: 'Delivery' }, unit_amount: delivery_cost }, quantity: 1 })

  const session = await getStripe().checkout.sessions.create({
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
