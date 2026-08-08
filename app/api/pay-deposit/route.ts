// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

let stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  return stripe
}

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${origin}/auth/signin`)

    const bookingId = new URL(request.url).searchParams.get('booking_id') || ''
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).eq('customer_id', user.id).single()
    if (!booking) return NextResponse.redirect(`${origin}/account?tab=bookings`)
    if (booking.deposit_paid) return NextResponse.redirect(`${origin}/account?tab=bookings`)

    // Self-heal: a booking with nothing actually owed (£0 deposit) can't go through
    // Stripe at all — it rejects £0 checkout sessions outright, which is what was
    // causing this route to 500. There's nothing to charge, so just confirm it.
    if (!booking.deposit_amount || booking.deposit_amount <= 0) {
      await supabase.from('bookings').update({ status: 'confirmed', deposit_paid: true }).eq('id', booking.id)
      return NextResponse.redirect(`${origin}/account?tab=bookings&booking_paid=1`)
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: `Booking Deposit — ${booking.reference}` }, unit_amount: booking.deposit_amount }, quantity: 1 }],
      success_url: `${origin}/account?tab=bookings&booking_paid=1`,
      cancel_url:  `${origin}/account?tab=bookings`,
      metadata: { type: 'booking_deposit', booking_id: bookingId },
    })

    return NextResponse.redirect(session.url!)
  } catch (err) {
    console.error('pay-deposit failed:', err)
    return NextResponse.redirect(`${origin}/account?tab=bookings&payment_error=1`)
  }
}
