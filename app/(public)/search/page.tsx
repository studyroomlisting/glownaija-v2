// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import SalonCard from '@/components/salon/SalonCard'
import ProductCard from '@/components/shop/ProductCard'
import { ukDateString, matchServiceCategory, UK_CITIES } from '@/lib/utils'

export default async function SearchPage({ searchParams }: { searchParams: { q?: string; type?: string; near?: string } }) {
  const q = searchParams.q?.trim() || ''
  const near = searchParams.near?.trim() || ''
  const supabase = await createClient()
  let salons: any[] = [], products: any[] = [], events: any[] = []
  const s = supabase; const t = searchParams.type || 'all'

  if (near) {
    // Detected-location search: only salons whose city matches what we detected.
    // Deliberately does NOT fall back to showing unrelated cities — if there's
    // nothing in the user's own city, they should see that clearly, not a list
    // of salons somewhere else that could be mistaken for "near me" results.
    const { data: exact } = await s.from('salons').select('*')
      .eq('listing_status','approved').eq('is_active',true)
      .ilike('city', near)
      .order('rating',{ascending:false}).limit(24)

    if (exact?.length) {
      salons = exact
    } else {
      // Reverse-geocoding can return a slightly different string than our
      // canonical city list (e.g. "Greater London" or a borough name instead
      // of "London") — try matching the detected name against known UK cities
      // before concluding there's genuinely nothing nearby.
      const knownMatch = UK_CITIES.find(c =>
        c.toLowerCase() === near.toLowerCase() ||
        near.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(near.toLowerCase())
      )
      if (knownMatch) {
        const { data } = await s.from('salons').select('*')
          .eq('listing_status','approved').eq('is_active',true)
          .eq('city', knownMatch)
          .order('rating',{ascending:false}).limit(24)
        salons = data || []
      }
    }
  } else if (!q) {
    // Empty search + clicking the button directly: show all salons rather than
    // nothing. Products/events stay empty here since this is specifically about
    // browsing salons — searching a term still shows all three as before.
    if (t==='all'||t==='salons') {
      const { data } = await s.from('salons').select('*')
        .eq('listing_status','approved').eq('is_active',true)
        .order('rating',{ascending:false}).limit(24)
      salons = data || []
    }
  } else if (q.length >= 2) {
    if (t==='all'||t==='salons') {
      // Also match salons that offer a service whose name contains the search
      // term — e.g. "knotless braids" should find the salon even if neither its
      // name nor location literally contains those words.
      const { data: matchingServices } = await s.from('services').select('salon_id').ilike('name', `%${q}%`)
      const serviceSalonIds = [...new Set((matchingServices || []).map(r => r.salon_id))]

      const orClauses = [`name.ilike.%${q}%`, `area.ilike.%${q}%`, `city.ilike.%${q}%`]
      if (serviceSalonIds.length) orClauses.push(`id.in.(${serviceSalonIds.join(',')})`)
      const { data: textMatches } = await s.from('salons').select('*')
        .eq('listing_status','approved').eq('is_active',true)
        .or(orClauses.join(','))
        .order('rating',{ascending:false}).limit(9)

      // Also match when the search text itself names a known service category
      // (matching Browse by Category exactly) — e.g. "braids" or "barber" should
      // find salons offering that category, even when no individual service's
      // literal name field contains that word. Run as a separate query (using
      // the proven .contains() method) and merge, rather than mixing an
      // array-type condition into the raw .or() string above.
      const categorySlug = matchServiceCategory(q)
      let categoryMatches: any[] = []
      if (categorySlug) {
        const { data } = await s.from('salons').select('*')
          .eq('listing_status','approved').eq('is_active',true)
          .contains('service_types', [categorySlug])
          .order('rating',{ascending:false}).limit(9)
        categoryMatches = data || []
      }

      const merged = new Map<string, any>()
      for (const row of [...(textMatches || []), ...categoryMatches]) merged.set(row.id, row)
      salons = Array.from(merged.values()).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 9)
    }
    if (t==='all'||t==='products') { const {data} = await s.from('products').select('*').eq('is_active',true).or(`name.ilike.%${q}%,brand.ilike.%${q}%`).order('rating',{ascending:false}).limit(8); products=data||[] }
    if (t==='all'||t==='events')   { const {data} = await s.from('events').select('*').eq('is_active',true).gte('event_date',ukDateString()).or(`title.ilike.%${q}%,city.ilike.%${q}%`).order('event_date').limit(6); events=data||[] }
  }
  const total = salons.length+products.length+events.length
  return (
    <div className="container py-8">
      <form action="/search" className="flex gap-3 mb-6"><input name="q" defaultValue={q} className="input flex-1" placeholder="Search salons, products, events…" autoFocus/><button className="btn btn-primary">Search</button></form>
      {near
        ? <p className="text-ink-3 text-sm mb-6">📍 Showing salons near <strong className="text-ink">{near}</strong></p>
        : q
          ? <p className="text-ink-3 text-sm mb-6">{total} results for "<strong className="text-ink">{q}</strong>"</p>
          : <p className="text-ink-3 text-sm mb-6">{salons.length} salon{salons.length !== 1 ? 's' : ''} — showing all</p>
      }
      {salons.length>0 && <div className="mb-8"><h2 className="font-bold text-xl mb-4">✂️ Salons</h2><div className="grid-3">{salons.map(s=><SalonCard key={s.id} salon={s}/>)}</div></div>}
      {near && !salons.length && (
        <div className="text-center py-16 text-ink-3">
          <div className="text-6xl mb-4">📍</div>
          <p className="font-bold text-lg">There is no salon found in your {near} city.</p>
          <p className="mt-1">Try searching a different city, or browse all salons instead.</p>
          <a href="/search" className="btn btn-outline btn-sm mt-4 inline-flex">Browse All Salons</a>
        </div>
      )}
      {q && !salons.length && !products.length && !events.length && (
        <div className="text-center py-16 text-ink-3"><div className="text-6xl mb-4">🔍</div><p className="font-bold text-lg">No results found</p><p>Try a different search term</p></div>
      )}
      {products.length>0 && <div className="mb-8"><h2 className="font-bold text-xl mb-4">🛍️ Products</h2><div className="grid-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div></div>}
    </div>
  )
}