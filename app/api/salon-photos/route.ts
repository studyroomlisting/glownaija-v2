// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { salon_id, urls } = await request.json()
  if (!salon_id || !urls?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { data: salon } = await supabase.from('salons').select('id,images').eq('id', salon_id).eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  const merged = [...new Set([...(salon.images || []), ...urls])].slice(0, 10)
  await supabase.from('salons').update({ images: merged }).eq('id', salon_id)
  return NextResponse.json({ success: true, images: merged })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { salon_id, url } = await request.json()
  if (!salon_id || !url) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { data: salon } = await supabase.from('salons').select('id,images').eq('id', salon_id).eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  const current = salon.images || []
  if (!current.includes(url)) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  // Move the chosen photo to the front — the first image is treated as the cover
  // photo everywhere else in the app (salon card, hero banner, etc.), so making
  // this the only way to change it keeps that convention working unchanged.
  const reordered = [url, ...current.filter((img: string) => img !== url)]
  await supabase.from('salons').update({ images: reordered }).eq('id', salon_id)
  return NextResponse.json({ success: true, images: reordered })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { salon_id, url } = await request.json()
  const { data: salon } = await supabase.from('salons').select('id,images').eq('id', salon_id).eq('owner_id', user.id).single()
  if (!salon) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  const images = (salon.images || []).filter((img: string) => img !== url)
  await supabase.from('salons').update({ images }).eq('id', salon_id)
  return NextResponse.json({ success: true, images })
}
