// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import SalonCard from '@/components/salon/SalonCard'
import { fmtPrice } from '@/lib/utils'

interface SalonsSearchParams {
  city?: string; service?: string; search?: string
  price_min?: string; price_max?: string
  sort?: string; view?: string
  verified?: string; open?: string; featured?: string
  page?: string
}

export default async function SalonsPage({ searchParams }: { searchParams: SalonsSearchParams }) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1')
  const per  = 12
  const sort = searchParams.sort || 'rating'
  const view = searchParams.view === 'list' ? 'list' : 'grid'

  let query = supabase.from('salons').select('*', { count: 'exact' })
    .eq('listing_status', 'approved').eq('is_active', true)

  if (searchParams.city)       query = query.eq('city', searchParams.city)
  if (searchParams.service)    query = query.contains('service_types', [searchParams.service])
  if (searchParams.search) {
    const term = searchParams.search.trim()
    // Also match salons that offer a service whose name contains the search term
    // (e.g. searching "knotless braids" should find the salon even if neither its
    // name nor area literally contains those words).
    const { data: matchingServices } = await supabase.from('services').select('salon_id').ilike('name', `%${term}%`)
    const serviceSalonIds = [...new Set((matchingServices || []).map(s => s.salon_id))]
    if (serviceSalonIds.length) {
      query = query.or(`name.ilike.%${term}%,area.ilike.%${term}%,id.in.(${serviceSalonIds.join(',')})`)
    } else {
      query = query.or(`name.ilike.%${term}%,area.ilike.%${term}%`)
    }
  }
  if (searchParams.price_min)  query = query.gte('price_from', parseInt(searchParams.price_min))
  if (searchParams.price_max)  query = query.lte('price_from', parseInt(searchParams.price_max))
  if (searchParams.verified === '1') query = query.eq('is_verified', true)
  if (searchParams.open === '1')     query = query.eq('is_open', true)
  if (searchParams.featured === '1') query = query.eq('is_featured', true)

  if (sort === 'price_low')       query = query.order('price_from', { ascending: true })
  else if (sort === 'price_high') query = query.order('price_from', { ascending: false })
  else if (sort === 'newest')     query = query.order('created_at', { ascending: false })
  else                             query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false })

  query = query.range((page - 1) * per, page * per - 1)

  const { data: salons, count } = await query
  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / per))

  const cities = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff']
  const serviceTypes = [
    { slug: 'braids',   label: 'Braids' },
    { slug: 'locs',     label: 'Locs' },
    { slug: 'wigs',     label: 'Wigs' },
    { slug: 'nails',    label: 'Nails' },
    { slug: 'makeup',   label: 'Makeup' },
    { slug: 'skincare', label: 'Skincare' },
    { slug: 'colour',   label: 'Barber' },
    { slug: 'natural',  label: 'Natural Hair' },
  ]

  // Preserves every active filter while overriding only what's passed in — used by
  // sort links, the view toggle, quick-filter pills, and pagination so switching one
  // control never resets the others.
  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = {
      city: searchParams.city, service: searchParams.service, search: searchParams.search,
      price_min: searchParams.price_min, price_max: searchParams.price_max,
      sort: searchParams.sort, view: searchParams.view,
      verified: searchParams.verified, open: searchParams.open, featured: searchParams.featured,
      page: searchParams.page,
      ...overrides,
    }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    const qs = params.toString()
    return `/salons${qs ? `?${qs}` : ''}`
  }

  const heading = searchParams.featured === '1'
    ? 'Featured Salons'
    : searchParams.city ? `Salons in ${searchParams.city}` : 'All Salons'

  // Pagination window: show a handful of page numbers around the current page,
  // not every page (important now that filters can produce many pages).
  const pageWindow = 2
  const pageNumbers: number[] = []
  for (let p = Math.max(1, page - pageWindow); p <= Math.min(totalPages, page + pageWindow); p++) pageNumbers.push(p)

  return (
    <div className="container py-8">

      {/* Breadcrumb */}
      <div className="text-xs text-ink-3 mb-3">
        <Link href="/" className="hover:text-rose">Home</Link> / <span className="text-ink-2 font-medium">Salons</span>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h1 className="text-2xl md:text-3xl font-black">{heading}</h1>
        <span className="badge-pill bg-page-2 text-ink-3 text-xs">{total} Listed found</span>
      </div>
      <p className="text-ink-3 text-sm mb-6">Verified salons, real reviews &amp; transparent prices</p>

      {/* Search bar */}
      <form action="/salons" method="get" className="card card-body flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <input name="search" defaultValue={searchParams.search || ''} className="input" placeholder="Search salon, area, service…"/>
        </div>
        <div className="w-28">
          <label className="label">Min £</label>
          <input name="price_min" type="number" min="0" defaultValue={searchParams.price_min || ''} className="input" placeholder="0"/>
        </div>
        <div className="w-28">
          <label className="label">Max £</label>
          <input name="price_max" type="number" min="0" defaultValue={searchParams.price_max || ''} className="input" placeholder="Any"/>
        </div>
        <div className="w-40">
          <label className="label">City</label>
          <select name="city" defaultValue={searchParams.city || ''} className="input">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-44">
          <label className="label">Service Type</label>
          <select name="service" defaultValue={searchParams.service || ''} className="input">
            <option value="">Any Service</option>
            {serviceTypes.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
          </select>
        </div>
        {/* Preserve sort/view when a new search is submitted */}
        {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort}/>}
        {searchParams.view && <input type="hidden" name="view" value={searchParams.view}/>}
        {searchParams.featured && <input type="hidden" name="featured" value={searchParams.featured}/>}
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Sort + quick filters + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-ink-3 uppercase tracking-wide mr-1">Sort:</span>
          {[
            ['rating', 'Top Rated'],
            ['price_low', 'Price: Low to High'],
            ['price_high', 'Price: High to Low'],
            ['newest', 'Newest'],
          ].map(([val, label]) => (
            <Link key={val} href={buildUrl({ sort: val === 'rating' ? undefined : val, page: undefined })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${sort === val ? 'bg-ink text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={buildUrl({ verified: searchParams.verified === '1' ? undefined : '1', page: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${searchParams.verified === '1' ? 'bg-gn text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
            ✓ Verified only
          </Link>
          <Link href={buildUrl({ open: searchParams.open === '1' ? undefined : '1', page: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${searchParams.open === '1' ? 'bg-gn text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
            ● Open now
          </Link>
          <div className="flex items-center rounded-full border border-bdr overflow-hidden ml-1">
            <Link href={buildUrl({ view: undefined })} aria-label="Grid view"
              className={`px-3 py-1.5 text-xs font-bold ${view === 'grid' ? 'bg-ink text-white' : 'bg-white text-ink-3 hover:bg-page-2'}`}>
              ▦ Grid
            </Link>
            <Link href={buildUrl({ view: 'list' })} aria-label="List view"
              className={`px-3 py-1.5 text-xs font-bold ${view === 'list' ? 'bg-ink text-white' : 'bg-white text-ink-3 hover:bg-page-2'}`}>
              ☰ List
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main column */}
        <div>
          {!salons?.length ? (
            <div className="text-center py-16 text-ink-3">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-lg">No salons found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
              <Link href="/salons" className="btn btn-outline btn-sm mt-4">Clear all filters</Link>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {salons.map(s => <SalonCard key={s.id} salon={s}/>)}
            </div>
          ) : (
            <div className="space-y-3">
              {salons.map(s => {
                const img = s.images?.[0]
                return (
                  <Link key={s.id} href={`/salon/${s.slug}`} className="card flex gap-4 p-3 items-stretch hover:shadow-lg transition-all">
                    <div className="relative w-36 sm:w-48 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-ink to-purple-900">
                      {img
                        ? <Image src={img} alt={s.name} fill className="object-cover"/>
                        : <div className="absolute inset-0 flex items-center justify-center text-4xl">{s.emoji}</div>}
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold truncate">{s.name}</h3>
                        {s.is_verified && <span className="badge-pill bg-gn/90 text-white text-2xs">✓ Verified</span>}
                        {s.is_featured && <span className="badge-pill bg-gold/90 text-white text-2xs">★ Featured</span>}
                      </div>
                      <p className="text-xs text-ink-3 mb-2">📍 {s.area}, {s.city}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-ink-3 font-semibold">{s.rating > 0 ? `★ ${s.rating} (${s.review_count})` : '⭐ New'}</span>
                        {s.price_from > 0 && <span className="text-xs text-ink-3">From <strong className="text-ink">{fmtPrice(s.price_from * 100)}</strong></span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="btn btn-outline btn-sm">← Prev</Link>
              )}
              {pageNumbers[0] > 1 && <span className="text-ink-3 text-sm px-1">…</span>}
              {pageNumbers.map(p => (
                <Link key={p} href={buildUrl({ page: String(p) })}
                  className={`btn btn-sm ${page === p ? 'bg-ink text-white' : 'btn-outline'}`}>
                  {p}
                </Link>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="text-ink-3 text-sm px-1">…</span>}
              {page < totalPages && (
                <Link href={buildUrl({ page: String(page + 1) })} className="btn btn-outline btn-sm">Next →</Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card card-body bg-ink text-white">
            <p className="font-black mb-1">List your salon</p>
            <p className="text-xs text-white/60 mb-4">Reach clients looking for the perfect salon to book.</p>
            <Link href="/business" className="btn bg-rose text-white w-full justify-center hover:bg-rose-dark">List your salon →</Link>
          </div>
          <div className="card card-body">
            <p className="font-bold text-sm mb-1">Need help?</p>
            <p className="text-xs text-ink-3 mb-3">Our support team is here to help you find the perfect salon.</p>
            <a href="mailto:hello@glownaija.co.uk" className="text-rose text-xs font-bold">✉ Email support</a>
          </div>
        </aside>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-bdr">
        {[
          ['✓', 'Verified salons', 'Every listing manually checked'],
          ['⚡', 'Instant booking', 'Book your slot and pay securely'],
          ['🔒', 'Secure payment', '100% secure payment on GlowNaija'],
          ['📅', 'Live availability', 'Real-time slots, no back-and-forth'],
        ].map(([icon, title, desc]) => (
          <div key={title as string} className="flex items-start gap-2.5">
            <span className="icon-badge w-8 h-8 text-sm bg-page-2 flex-shrink-0">{icon}</span>
            <div>
              <p className="text-xs font-bold">{title}</p>
              <p className="text-2xs text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
