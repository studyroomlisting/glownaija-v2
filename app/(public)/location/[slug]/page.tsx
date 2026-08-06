// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import SalonCard from '@/components/salon/SalonCard'
import PageHero from '@/components/layout/PageHero'
export default async function LocationPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const city = params.slug.charAt(0).toUpperCase()+params.slug.slice(1)
  const { data: salons } = await supabase.from('salons').select('*').eq('listing_status','approved').eq('is_active',true).eq('city',city).order('rating',{ascending:false})
  return (<><PageHero title={`Salons in ${city}`} subtitle={`${salons?.length||0} salons found`}/><div className="container py-8"><div className="grid-3">{salons?.map(s=><SalonCard key={s.id} salon={s}/>)}</div></div></>)
}