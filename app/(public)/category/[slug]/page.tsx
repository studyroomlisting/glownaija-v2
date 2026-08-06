// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import SalonCard from '@/components/salon/SalonCard'
import PageHero from '@/components/layout/PageHero'
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: salons } = await supabase.from('salons').select('*').eq('listing_status','approved').eq('is_active',true).contains('service_types',[params.slug]).order('rating',{ascending:false})
  const label = params.slug.charAt(0).toUpperCase()+params.slug.slice(1)
  return (<><PageHero title={`${label} Salons`} subtitle={`${salons?.length||0} salons offering ${label.toLowerCase()} services`}/><div className="container py-8"><div className="grid-3">{salons?.map(s=><SalonCard key={s.id} salon={s}/>)}</div></div></>)
}