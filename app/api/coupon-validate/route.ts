// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fmtPrice } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code        = (searchParams.get('code') || '').toUpperCase().trim()
  const order_total = parseInt(searchParams.get('order_total') || '0')

  if (!code || code.length < 3) return NextResponse.json({ error: 'Invalid coupon format' })

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).eq('is_active', true)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .or(`max_uses.is.null,uses_count.lt.max_uses`)
    .single()

  if (!coupon) return NextResponse.json({ error: 'Invalid or expired coupon code' })
  if (order_total < (coupon.min_order_pence || 0))
    return NextResponse.json({ error: `Minimum order of ${fmtPrice(coupon.min_order_pence)} required` })

  const discount = coupon.coupon_type === 'percent'
    ? Math.round(order_total * coupon.value / 100)
    : coupon.value

  return NextResponse.json({
    discount_pence: Math.min(discount, order_total),
    coupon_id: coupon.id, code,
    description: coupon.coupon_type === 'percent' ? `${coupon.value}% off` : `${fmtPrice(coupon.value)} off`,
  })
}
