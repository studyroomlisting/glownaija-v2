// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name  = searchParams.get('name')  || ''
  const city  = searchParams.get('city')  || ''
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || ''
  const instagram = searchParams.get('instagram') || ''

  if (name.length < 2) return NextResponse.json({ name: { duplicate: false } })

  const supabase = await createClient()
  const result: Record<string, { duplicate: boolean; match?: string }> = {}

  // Name + city
  if (name) {
    let q = supabase.from('salons').select('name').ilike('name', name).eq('is_active', true)
    if (city) q = q.eq('city', city)
    const { data } = await q.limit(1)
    result.name = { duplicate: !!data?.length, match: data?.[0]?.name }
  }
  // Email
  if (email) {
    const { data } = await supabase.from('salons').select('name').eq('email', email).eq('is_active', true).limit(1)
    result.email = { duplicate: !!data?.length, match: data?.[0]?.name }
  }
  // Phone
  if (phone) {
    const { data } = await supabase.from('salons').select('name').eq('phone', phone).eq('is_active', true).limit(1)
    result.phone = { duplicate: !!data?.length, match: data?.[0]?.name }
  }
  // Instagram
  if (instagram) {
    const { data } = await supabase.from('salons').select('name').ilike('instagram', instagram).eq('is_active', true).limit(1)
    result.instagram = { duplicate: !!data?.length, match: data?.[0]?.name }
  }

  return NextResponse.json(result)
}
