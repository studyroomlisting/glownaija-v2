// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import SaveButton from '@/components/salon/SaveButton'

const CATEGORY_LABELS: Record<string, string> = {
  braids: 'Braids', locs: 'Locs', wigs: 'Wigs', nails: 'Nails',
  makeup: 'Makeup', skincare: 'Skincare', barber: 'Barber', bridal: 'Bridal',
  colour: 'Colour', natural: 'Natural Hair', wax: 'Waxing & Threading',
}

export default async function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: { sort?: string } }) {
  const supabase = await createClient()
  const sort = searchParams.sort || 'recommended'

  let query = supabase.from('salons').select('*')
    .eq('listing_status', 'approved').eq('is_active', true)
    .contains('service_types', [params.slug])

  if (sort === 'rating')     query = query.order('rating', { ascending: false })
  else if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else                        query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false })

  const { data: salons } = await query

  const { data: { user } } = await supabase.auth.getUser()
  let savedIds = new Set<string>()
  if (user && salons?.length) {
    const { data: saved } = await supabase.from('saved_salons').select('salon_id').eq('user_id', user.id).in('salon_id', salons.map(s => s.id))
    savedIds = new Set((saved || []).map(s => s.salon_id))
  }

  const label = CATEGORY_LABELS[params.slug] || (params.slug.charAt(0).toUpperCase() + params.slug.slice(1))
  const total = salons?.length || 0

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-72 overflow-hidden">
        <Image src="/assets/images/hero-salon.png" alt={`${label} salons`} fill priority quality={85} sizes="100vw" className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30"/>
        <div className="container relative z-10 h-full flex flex-col justify-center">
          <div className="text-xs text-white/60 mb-2">
            <Link href="/" className="hover:text-white">Home</Link> / <Link href="/salons" className="hover:text-white">Salons</Link> / <span className="text-white">{label} Salons</span>
          </div>
          <h1 className="text-white text-4xl md:text-5xl font-black mb-2">{label} Salons</h1>
          <p className="text-white/70 text-sm mb-4">{total} salon{total !== 1 ? 's' : ''} offering professional {label.toLowerCase()} services</p>
          <div className="flex gap-2 flex-wrap">
            {[['🛡️', 'Verified Salons'], ['👥', 'Trusted Professionals'], ['🏅', 'Quality Service']].map(([icon, label]) => (
              <span key={label} className="badge-pill bg-white/10 border border-white/20 text-white text-xs flex items-center gap-1.5">
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
          <h2 className="text-xl font-black">All {label} Salons <span className="text-rose">({total})</span></h2>
          <div className="flex gap-1">
            {[['recommended', 'Recommended'], ['rating', 'Top Rated'], ['newest', 'Newest']].map(([val, lbl]) => (
              <Link key={val} href={`/category/${params.slug}${val === 'recommended' ? '' : `?sort=${val}`}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${sort === val ? 'bg-ink text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
                {lbl}
              </Link>
            ))}
          </div>
        </div>

        {!salons?.length ? (
          <div className="text-center py-16 text-ink-3">
            <p className="text-5xl mb-3">✂️</p>
            <p className="font-bold text-lg">No {label.toLowerCase()} salons yet</p>
            <p className="text-sm mt-1">Check back soon, or browse all salons.</p>
            <Link href="/salons" className="btn btn-outline btn-sm mt-4">Browse All Salons</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {salons.map(s => {
              const img = s.images?.[0]
              return (
                <div key={s.id} className="card overflow-hidden">
                  <div className="relative h-52">
                    <Link href={`/salon/${s.slug}`}>
                      {img
                        ? <Image src={img} alt={s.name} fill sizes="400px" className="object-cover"/>
                        : <div className="w-full h-full bg-gradient-to-br from-ink to-purple-900 flex items-center justify-center text-5xl">{s.emoji}</div>}
                    </Link>
                    <div className="absolute top-3 right-3">
                      <SaveButton salonId={s.id} initialSaved={savedIds.has(s.id)} iconOnly className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-sm shadow-md"/>
                    </div>
                    <span className={`absolute bottom-3 left-3 badge-pill text-white text-2xs ${s.is_open ? 'bg-gn' : 'bg-ink/70'}`}>
                      ● {s.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/salon/${s.slug}`} className="font-bold text-sm hover:text-rose truncate block">{s.name}</Link>
                      <p className="text-xs text-ink-3">📍 {s.area}, {s.city}</p>
                      <p className="text-xs text-ink-3 mt-0.5">{s.rating > 0 ? `★ ${s.rating} (${s.review_count})` : '⭐ New'}</p>
                    </div>
                    <Link href={`/salon/${s.slug}`} className="btn btn-primary btn-sm text-xs flex-shrink-0">View Details →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
