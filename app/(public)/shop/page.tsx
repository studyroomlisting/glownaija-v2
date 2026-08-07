// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/shop/ProductCard'

interface ShopSearchParams { cat?: string; search?: string; sort?: string; page?: string }

const CATEGORIES = [
  ['',            'All Products', '🌟'],
  ['Hair Care',   'Hair Care',    '🧴'],
  ['Nail',        'Nails',        '💅'],
  ['Skincare',    'Skincare',     '🧴'],
  ['Makeup',      'Makeup',       '💄'],
  ['Tools',       'Tools',        '🔧'],
  ['Accessories', 'Accessories',  '👑'],
]

export default async function ShopPage({ searchParams }: { searchParams: ShopSearchParams }) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1')
  const per  = 16
  const sort = searchParams.sort || 'rating'

  let q = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true)
  if (searchParams.cat)    q = q.eq('category', searchParams.cat)
  if (searchParams.search) q = q.or(`name.ilike.%${searchParams.search}%,brand.ilike.%${searchParams.search}%`)

  if (sort === 'price_low')       q = q.order('price', { ascending: true })
  else if (sort === 'price_high') q = q.order('price', { ascending: false })
  else if (sort === 'newest')     q = q.order('created_at', { ascending: false })
  else                             q = q.order('rating', { ascending: false })

  q = q.range((page - 1) * per, page * per - 1)

  const { data: products, count } = await q
  const total = count || 0
  const totalPages = Math.max(1, Math.ceil(total / per))

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { cat: searchParams.cat, search: searchParams.search, sort: searchParams.sort, page: searchParams.page, ...overrides }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    const qs = params.toString()
    return `/shop${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-ink to-purple-900 py-8">
        <div className="container">
          <div className="text-xs text-white/50 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> / <span className="text-white">Beauty Shop</span>
          </div>
          <h1 className="text-white text-3xl font-black mb-1">Beauty Shop</h1>
          <p className="text-white/60 text-sm">Authentic Nigerian &amp; Afro-Caribbean beauty products</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search */}
        <form action="/shop" className="flex gap-3 mb-5">
          {searchParams.cat && <input type="hidden" name="cat" value={searchParams.cat} />}
          {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
          <input name="search" defaultValue={searchParams.search || ''} className="input flex-1" placeholder="Search products… e.g. Shea Moisture, 4C, SPF" />
          <button className="btn btn-primary">Search</button>
        </form>

        {/* Categories + sort */}
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(([val, label, icon]) => (
              <Link key={val || 'all'} href={buildUrl({ cat: val || undefined, page: undefined })}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${(searchParams.cat || '') === val ? 'bg-rose text-white' : 'bg-white border border-bdr text-ink-2 hover:border-rose'}`}>
                <span>{icon}</span>{label}
              </Link>
            ))}
          </div>

          <div className="flex gap-1 flex-wrap">
            {[['rating', 'Top Rated'], ['price_low', 'Price: Low to High'], ['price_high', 'Price: High to Low'], ['newest', 'Newest']].map(([val, label]) => (
              <Link key={val} href={buildUrl({ sort: val === 'rating' ? undefined : val, page: undefined })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${sort === val ? 'bg-ink text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-ink-3 font-semibold mb-4">{total} product{total !== 1 ? 's' : ''}</p>

        {!products?.length ? (
          <div className="text-center py-16 text-ink-3">
            <p className="text-5xl mb-3">🛍️</p>
            <p className="font-bold text-lg">No products found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
            <Link href="/shop" className="btn btn-outline btn-sm mt-4">Clear filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="btn btn-outline btn-sm">← Prev</Link>}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-ink-3 text-sm">…</span>}
                  <Link href={buildUrl({ page: String(p) })} className={`btn btn-sm ${page === p ? 'bg-ink text-white' : 'btn-outline'}`}>{p}</Link>
                </span>
              ))}
            {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="btn btn-outline btn-sm">Next →</Link>}
          </div>
        )}
      </div>
    </div>
  )
}
