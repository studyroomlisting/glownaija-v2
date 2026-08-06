// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient }     from '@/lib/supabase/server'
import { notFound }         from 'next/navigation'
import Link                 from 'next/link'
import Image                from 'next/image'
import type { Metadata }    from 'next'
import { fmtPrice }         from '@/lib/utils'
import ProductCard          from '@/components/shop/ProductCard'
import AddToCartButton      from '@/components/shop/AddToCartButton'
import WishlistButton       from '@/components/shop/WishlistButton'
import StarRating           from '@/components/salon/StarRating'
import Breadcrumb           from '@/components/layout/Breadcrumb'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: p } = await supabase.from('products').select('name,brand,description').eq('id', params.id).single()
  if (!p) return { title: 'Product Not Found' }
  return {
    title: `${p.name} by ${p.brand}`,
    description: p.description?.substring(0, 160) || `${p.name} — GlowNaija Beauty Shop`,
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [
    { data: p },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).eq('is_active', true).single(),
    supabase.auth.getUser(),
  ])

  if (!p) notFound()

  const [
    { data: related },
    { data: savedRow },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('category', p.category).neq('id', p.id).eq('is_active', true).order('rating',{ascending:false}).limit(4),
    user ? supabase.from('saved_products').select('id').eq('user_id', user.id).eq('product_id', p.id).single() : { data: null },
  ])

  const saved       = !!savedRow
  const hasDiscount = p.original_price && p.original_price > p.price
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.original_price!) * 100) : 0

  return (
    <div>
      <Breadcrumb crumbs={[
        { label:'Home', href:'/' },
        { label:'Shop', href:'/shop' },
        { label: p.category, href:`/shop?cat=${p.category}` },
        { label: p.name },
      ]}/>

      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">

          {/* ── Images ────────────────────────────────────────────────── */}
          <div>
            {/* Main image */}
            <div className="aspect-square bg-page-2 rounded-2xl overflow-hidden mb-3 relative">
              {p.images?.[0]
                ? <Image src={p.images[0]} alt={p.name} fill className="object-cover"/>
                : <div className="absolute inset-0 flex items-center justify-center text-9xl">🧴</div>
              }
              {hasDiscount && (
                <span className="absolute top-4 left-4 badge-pill bg-rose text-white text-sm font-black">
                  -{discountPct}%
                </span>
              )}
            </div>
            {/* Thumbnail strip */}
            {(p.images?.length || 0) > 1 && (
              <div className="flex gap-2">
                {p.images!.slice(0, 5).map((img, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-bdr hover:border-rose transition-colors cursor-pointer">
                    <Image src={img} alt={`${p.name} ${i+1}`} width={64} height={64} className="w-full h-full object-cover"/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ───────────────────────────────────────────────── */}
          <div>
            {/* Brand + category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-rose">{p.brand}</span>
              <span className="text-ink-3">·</span>
              <Link href={`/shop?cat=${p.category}`} className="text-xs text-ink-3 hover:text-rose">{p.category}</Link>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-black mb-3 leading-tight">{p.name}</h1>

            {/* Rating */}
            {p.rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating value={Math.round(p.rating)} readonly size="sm"/>
                <span className="font-bold text-sm">{p.rating}</span>
                <span className="text-ink-3 text-sm">({p.review_count} review{p.review_count !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-black">{fmtPrice(p.price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-ink-3 line-through">{fmtPrice(p.original_price!)}</span>
                  <span className="text-rose font-bold text-sm">Save {fmtPrice(p.original_price! - p.price)}</span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-5">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.stock_count > 5 ? 'bg-gn' : p.stock_count > 0 ? 'bg-gold' : 'bg-rose'}`}/>
              <span className="text-sm font-semibold text-ink-3">
                {p.stock_count > 5 ? 'In stock' : p.stock_count > 0 ? `Only ${p.stock_count} left!` : 'Out of stock'}
              </span>
            </div>

            {/* Badges */}
            {p.tags && p.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {p.tags.map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {p.description && (
              <p className="text-ink-2 text-sm leading-relaxed mb-6">{p.description}</p>
            )}

            {/* Actions — client components */}
            <AddToCartButton product={{ id:p.id, name:p.name, brand:p.brand, price:p.price, images:p.images||[], stock_count:p.stock_count }}/>
            {user
              ? <WishlistButton productId={p.id} initialSaved={saved}/>
              : <Link href={`/auth/signin?next=/shop/${p.id}`} className="btn btn-outline w-full justify-center mb-4">🤍 Sign in to Save</Link>
            }

            <Link href="/cart" className="text-xs text-ink-3 hover:text-rose block text-center">
              🛒 View Cart
            </Link>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                ['🚚','Free delivery over £50'],
                ['↩️','Free returns'],
                ['🔒','Secure checkout'],
                ['✅','Authentic products'],
              ].map(([icon, text]) => (
                <div key={text as string} className="flex items-center gap-2 text-xs text-ink-3">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product details tabs ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {p.how_to_use && (
            <div className="card card-body">
              <h2 className="font-bold text-lg mb-3">How to Use</h2>
              <p className="text-ink-2 text-sm leading-relaxed whitespace-pre-line">{p.how_to_use}</p>
            </div>
          )}
          {p.ingredients && (
            <div className="card card-body">
              <h2 className="font-bold text-lg mb-3">Ingredients</h2>
              <p className="text-ink-3 text-xs leading-relaxed">{p.ingredients}</p>
            </div>
          )}
        </div>

        {/* ── Related products ─────────────────────────────────────── */}
        {related && related.length > 0 && (
          <div>
            <h2 className="font-black text-2xl mb-5">You Might Also Like</h2>
            <div className="grid-4">
              {related.map(r => <ProductCard key={r.id} product={r}/>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
