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
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('checkout: STRIPE_SECRET_KEY is not set')
      return NextResponse.json({ error: "Online payment isn't set up yet for this site. Please contact support." }, { status: 500 })
    }

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

    // Stripe metadata values are capped at 500 characters each — a cart with several
    // items could exceed that and make session creation fail. Strip to only the fields
    // the webhook actually needs (id/name/price/quantity), which keeps this well under
    // the limit for realistic cart sizes without changing what the webhook consumes.
    const compactItems = items.map((item: any) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))
    const items_json = JSON.stringify(compactItems)
    if (items_json.length > 490) {
      return NextResponse.json({ error: 'Your cart has too many different items for checkout in one go — please split into smaller orders.' }, { status: 400 })
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${origin}/account?tab=orders&order_placed=1`,
      cancel_url:  `${origin}/checkout`,
      metadata: {
        type: 'shop', customer_id: user?.id || '',
        full_name, address, city, postcode,
        delivery_cost: String(delivery_cost),
        items_json,
        coupon_id: coupon_id || '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('checkout failed:', err)
    return NextResponse.json({ error: err?.message || 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
