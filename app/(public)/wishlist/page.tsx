// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import PageHero from '@/components/layout/PageHero'
export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/wishlist')
  const { data: saved } = await supabase.from('saved_products').select('product_id,products(*)').eq('user_id',user.id).order('created_at',{ascending:false})
  const products = saved?.map(s=>s.products).filter(Boolean) || []
  return (<><PageHero title="❤️ My Wishlist" subtitle={`${products.length} saved products`}/><div className="container py-8">{products.length?<div className="grid-4">{(products as any[]).map((p:any)=><ProductCard key={p.id} product={p}/>)}</div>:<div className="text-center py-16 text-ink-3"><div className="text-5xl mb-4">❤️</div><p className="font-bold mb-2">No saved products yet</p><a href="/shop" className="btn btn-primary">Browse Shop →</a></div>}</div></>)
}