// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { salon_id } = await request.json()
  if (!salon_id) return NextResponse.json({ error: 'No salon_id' }, { status: 400 })

  const { data: existing } = await supabase.from('saved_salons')
    .select('id').eq('user_id', user.id).eq('salon_id', salon_id).single()

  if (existing) {
    await supabase.from('saved_salons').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  } else {
    await supabase.from('saved_salons').insert({ user_id: user.id, salon_id })
    return NextResponse.json({ saved: true })
  }
}
