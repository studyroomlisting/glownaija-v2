// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const unreadOnly = new URL(request.url).searchParams.get('unread') === '1'
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '20'), 50)

  let query = supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit)
  if (unreadOnly) query = query.eq('is_read', false)

  const { data } = await query
  const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)

  return NextResponse.json({ data: data || [], unread_count: count || 0 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (body.mark_all_read) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  }
  return NextResponse.json({ ok: true })
}
