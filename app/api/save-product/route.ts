// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { product_id } = await request.json()
  if (!product_id) return NextResponse.json({ error: 'No product_id' }, { status: 400 })

  const { data: existing } = await supabase.from('saved_products').select('id').eq('user_id', user.id).eq('product_id', product_id).single()
  if (existing) {
    await supabase.from('saved_products').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  }
  await supabase.from('saved_products').insert({ user_id: user.id, product_id })
  return NextResponse.json({ saved: true })
}
