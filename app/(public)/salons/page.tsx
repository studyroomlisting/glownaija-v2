// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import SalonCard from '@/components/salon/SalonCard'
import PageHero from '@/components/layout/PageHero'

export default async function SalonsPage({ searchParams }: { searchParams: { city?: string; service?: string; search?: string; page?: string } }) {
  const supabase = await createClient()
  const page = parseInt(searchParams.page || '1')
  const per  = 12
  let query  = supabase.from('salons').select('*',{count:'exact'}).eq('listing_status','approved').eq('is_active',true).order('is_featured',{ascending:false}).order('rating',{ascending:false}).range((page-1)*per,page*per-1)
  if (searchParams.city)    query = query.eq('city', searchParams.city)
  if (searchParams.service) query = query.contains('service_types', [searchParams.service])
  if (searchParams.search)  query = query.or(`name.ilike.%${searchParams.search}%,area.ilike.%${searchParams.search}%`)
  const { data: salons, count } = await query
  const total = count || 0
  const cities = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff']
  return (
    <>
      <PageHero title="Find Your Perfect Salon" subtitle={`${total} salons across the UK`} />
      <div className="container py-8">
        <div className="flex gap-2 flex-wrap mb-6">
          <a href="/salons" className="btn btn-sm bg-rose text-white">All Cities</a>
          {cities.map(c=><a key={c} href={`/salons?city=${c}`} className="btn btn-sm btn-outline">{c}</a>)}
        </div>
        {!salons?.length ? <div className="text-center py-16 text-ink-3"><p className="text-5xl mb-4">🔍</p><p className="font-bold text-lg">No salons found</p></div>
        : <div className="grid-3">{salons.map(s=><SalonCard key={s.id} salon={s}/>)}</div>}
        {total > per && <div className="flex justify-center gap-2 mt-8">{Array.from({length:Math.ceil(total/per)},(_,i)=><a key={i} href={`/salons?page=${i+1}`} className={`btn btn-sm ${page===i+1?'bg-ink text-white':'btn-outline'}`}>{i+1}</a>)}</div>}
      </div>
    </>
  )
}