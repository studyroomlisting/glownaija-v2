// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import SalonCard from '@/components/salon/SalonCard'
import ProductCard from '@/components/shop/ProductCard'

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const q = searchParams.q?.trim() || ''
  const supabase = await createClient()
  let salons: any[] = [], products: any[] = [], events: any[] = []
  if (q.length >= 2) {
    const s = supabase; const t = searchParams.type || 'all'
    if (t==='all'||t==='salons')   { const {data} = await s.from('salons').select('*').eq('listing_status','approved').eq('is_active',true).or(`name.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%`).order('rating',{ascending:false}).limit(9); salons=data||[] }
    if (t==='all'||t==='products') { const {data} = await s.from('products').select('*').eq('is_active',true).or(`name.ilike.%${q}%,brand.ilike.%${q}%`).order('rating',{ascending:false}).limit(8); products=data||[] }
    if (t==='all'||t==='events')   { const {data} = await s.from('events').select('*').eq('is_active',true).gte('event_date',new Date().toISOString().split('T')[0]).or(`title.ilike.%${q}%,city.ilike.%${q}%`).order('event_date').limit(6); events=data||[] }
  }
  const total = salons.length+products.length+events.length
  return (
    <div className="container py-8">
      <form action="/search" className="flex gap-3 mb-6"><input name="q" defaultValue={q} className="input flex-1" placeholder="Search salons, products, events…" autoFocus/><button className="btn btn-primary">Search</button></form>
      {q && <p className="text-ink-3 text-sm mb-6">{total} results for "<strong className="text-ink">{q}</strong>"</p>}
      {!q && <div className="text-center py-16 text-ink-3"><div className="text-6xl mb-4">🔍</div><p className="font-bold text-lg">Search anything</p><p>Salons, products, events, styles…</p></div>}
      {salons.length>0 && <div className="mb-8"><h2 className="font-bold text-xl mb-4">✂️ Salons</h2><div className="grid-3">{salons.map(s=><SalonCard key={s.id} salon={s}/>)}</div></div>}
      {products.length>0 && <div className="mb-8"><h2 className="font-bold text-xl mb-4">🛍️ Products</h2><div className="grid-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></div>}
    </div>
  )
}