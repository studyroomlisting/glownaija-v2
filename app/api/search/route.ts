// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q    = (searchParams.get('q') || '').trim()
  const type = searchParams.get('type') || 'all'

  if (q.length < 2) return NextResponse.json({ results: [], query: q, count: 0 })

  const supabase = await createClient()
  const results: any[] = []

  if (type === 'all' || type === 'salons') {
    const { data } = await supabase.from('salons').select('id,name,slug,emoji,area,city,rating,price_from,images')
      .eq('listing_status', 'approved').eq('is_active', true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%`)
      .order('rating', { ascending: false }).limit(5)
    results.push(...(data || []).map(s => ({ ...s, result_type: 'salon', image: s.images?.[0] || null })))
  }

  if (type === 'all' || type === 'products') {
    const { data } = await supabase.from('products').select('id,name,brand,price,images,rating')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`)
      .order('rating', { ascending: false }).limit(5)
    results.push(...(data || []).map(p => ({ ...p, result_type: 'product', image: p.images?.[0] || null })))
  }

  if (type === 'all' || type === 'events') {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('events').select('id,title,emoji,city,event_date,price,is_free,image_url')
      .eq('is_active', true).gte('event_date', today)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`)
      .order('event_date').limit(3)
    results.push(...(data || []).map(e => ({ ...e, name: e.title, result_type: 'event', image: e.image_url })))
  }

  return NextResponse.json({ results, query: q, count: results.length })
}
