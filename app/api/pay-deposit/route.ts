// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`)

  const bookingId = new URL(request.url).searchParams.get('booking_id') || ''
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).eq('customer_id', user.id).single()
  if (!booking || booking.deposit_paid) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/account?tab=bookings`)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'gbp', product_data: { name: `Booking Deposit — ${booking.reference}` }, unit_amount: booking.deposit_amount }, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=bookings&booking_paid=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/account?tab=bookings`,
    metadata: { type: 'booking_deposit', booking_id: bookingId },
  })

  return NextResponse.redirect(session.url!)
}
