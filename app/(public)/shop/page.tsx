// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/shop/ProductCard'
import PageHero from '@/components/layout/PageHero'

export default async function ShopPage({ searchParams }: { searchParams: { cat?: string; search?: string; page?: string } }) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1'); const per = 16
  let q = supabase.from('products').select('*',{count:'exact'}).eq('is_active',true).order('rating',{ascending:false}).range((page-1)*per,page*per-1)
  if (searchParams.cat)    q = q.eq('category', searchParams.cat)
  if (searchParams.search) q = q.or(`name.ilike.%${searchParams.search}%,brand.ilike.%${searchParams.search}%`)
  const { data: products, count } = await q
  const cats = ['Hair Care','Skincare','Nail','Makeup','Tools','Accessories']
  return (
    <>
      <PageHero title="Beauty Shop" subtitle="Afro & Caribbean hair and beauty products" />
      <div className="container py-8">
        <form action="/shop" className="flex gap-3 mb-6">
          <input name="search" defaultValue={searchParams.search} className="input flex-1" placeholder="Search products…"/>
          <button className="btn btn-primary">Search</button>
        </form>
        <div className="flex gap-2 flex-wrap mb-6">
          {cats.map(c=><a key={c} href={`/shop?cat=${c}`} className={`btn btn-sm ${searchParams.cat===c?'bg-ink text-white':'btn-outline'}`}>{c}</a>)}
        </div>
        {!products?.length ? <div className="text-center py-16 text-ink-3"><p className="text-5xl mb-3">🛍️</p><p className="font-bold">No products found</p></div>
        : <div className="grid-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
      </div>
    </>
  )
}