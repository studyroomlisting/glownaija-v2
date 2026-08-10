// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import Image             from 'next/image'
import { Fragment }      from 'react'
import Header            from '@/components/layout/Header'
import Footer            from '@/components/layout/Footer'
import HomeCarousel      from '@/components/home/HomeCarousel'
import FeaturedSalonCard from '@/components/home/FeaturedSalonCard'
import HomeProductCard   from '@/components/home/HomeProductCard'
import HomeEventCard     from '@/components/home/HomeEventCard'
import Testimonials      from '@/components/layout/Testimonials'
import { ukDateString, UK_CITIES }  from '@/lib/utils'

export const revalidate = 3600 // revalidate hourly

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: featured  },
    { data: products  },
    { data: events    },
    { count: salonCount },
    { count: userCount  },
    { data: allServiceTypes },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('salons').select('*').eq('listing_status','approved').eq('is_active',true).eq('is_featured',true).order('rating',{ascending:false}).limit(9),
    supabase.from('products').select('*').eq('is_active',true).order('rating',{ascending:false}).limit(9),
    supabase.from('events').select('*').eq('is_active',true).gte('event_date', ukDateString()).order('event_date').limit(6),
    supabase.from('salons').select('*',{count:'exact',head:true}).eq('is_active',true).eq('listing_status','approved'),
    supabase.from('profiles').select('*',{count:'exact',head:true}),
    supabase.from('salons').select('city,service_types').eq('listing_status','approved').eq('is_active',true),
    supabase.auth.getUser(),
  ])

  let savedIds = new Set<string>()
  if (user && featured?.length) {
    const { data: saved } = await supabase.from('saved_salons').select('salon_id').eq('user_id', user.id).in('salon_id', featured.map(s => s.id))
    savedIds = new Set((saved || []).map(s => s.salon_id))
  }

  // Real per-category salon counts — computed from live data, not hardcoded.
  const categoryCounts: Record<string, number> = {}
  // Real per-city salon counts — same idea, for the "Popular Cities" pills.
  const cityCounts: Record<string, number> = {}
  for (const row of allServiceTypes || []) {
    for (const cat of row.service_types || []) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
    if (row.city) cityCounts[row.city] = (cityCounts[row.city] || 0) + 1
  }

  // "Popular" = real cities with the most live salons. Falls back to the start
  // of the canonical list if there's no data yet, so this never renders empty.
  const popularCities = Object.keys(cityCounts).length
    ? Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).map(([city]) => city)
    : UK_CITIES
  const cities = UK_CITIES // full canonical list — every city an owner can actually pick when listing a salon
  const categories = [
    { slug:'braids',   label:'Braids',     emoji:'✂️',  desc:'Knotless, box braids & more' },
    { slug:'locs',     label:'Locs',       emoji:'🌿',  desc:'Starter locs & maintenance' },
    { slug:'wigs',     label:'Wigs',       emoji:'👑',  desc:'Custom & ready-to-wear wigs' },
    { slug:'nails',    label:'Nails',      emoji:'💅',  desc:'Gel, acrylic & nail art' },
    { slug:'makeup',   label:'Makeup',     emoji:'💄',  desc:'Bridal, glam & everyday' },
    { slug:'skincare', label:'Skincare',   emoji:'🧴',  desc:'Melanin-focused treatments' },
    { slug:'barber',   label:'Barber',     emoji:'💈',  desc:'Afro cuts & fades' },
    { slug:'bridal',   label:'Bridal',     emoji:'💍',  desc:'Full wedding packages' },
    { slug:'natural',  label:'Natural Hair', emoji:'🌱', desc:'Wash days & protective styles' },
    { slug:'colour',   label:'Colour',     emoji:'🎨',  desc:'Balayage, vivids & treatments' },
    { slug:'wax',      label:'Waxing',     emoji:'🪮',  desc:'Waxing & threading' },
  ]
  const categoryTints = ['bg-rose/10','bg-gold/10','bg-purple-100','bg-blue-100','bg-gn/10','bg-orange-100','bg-page-2','bg-pink-100','bg-rose/10','bg-gold/10','bg-purple-100']

  const howItWorks = [
    { step:'01', title:'Search & Discover', desc:'Browse hundreds of Nigerian and Afro-Caribbean salons by city, service, or style.', icon:'🔍' },
    { step:'02', title:'Book Instantly',    desc:'Choose your service, pick a slot, and pay a small deposit to secure your appointment.', icon:'📅' },
    { step:'03', title:'Experience & Review', desc:'Enjoy your appointment and share your experience to help other clients find great salons.', icon:'⭐' },
  ]

  const testimonials = [
    { name:'Adaeze O.', initial:'A', meta:'Knotless Braids · London', text:'Finally found a braider who understands 4C hair! Booked through GlowNaija and the experience was seamless.', rating:5 },
    { name:'Funmi B.', initial:'F', meta:'Starter Locs · Birmingham', text:'The salon I found does the most beautiful locs installations. GlowNaija made it so easy to find and book.', rating:5 },
    { name:'Kezia M.', initial:'K', meta:'Wig Installation · Manchester', text:'Brilliant platform. I\'ve discovered so many amazing Afro-Caribbean salons near me I didn\'t know existed.', rating:5 },
  ]

  return (
    <>
      <Header />
      <main>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-16 pb-28 md:pb-32">
          {/* Background image — fills the whole hero */}
          <div className="absolute inset-0">
            <Image src="/assets/images/hero-salon.png" alt="Modern salon interior" fill priority quality={90} sizes="100vw" className="object-cover"/>
          </div>
          {/* Fade overlay: opaque (image hidden) on the left where the text sits,
              fading to fully transparent (image fully visible) on the right. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/95 md:via-ink/80 to-ink/10 md:to-transparent"/>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 15% 30%, #E8607A 0%, transparent 45%), radial-gradient(circle at 85% 70%, #D4AF37 0%, transparent 45%)' }}/>

          <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy + search */}
            <div className="text-center lg:text-left">
              <div className="inline-block bg-rose/20 border border-rose/30 rounded-full px-4 py-1.5 text-rose text-2xs font-bold uppercase tracking-widest mb-6">
                The UK's #1 Afro &amp; Caribbean Beauty Platform
              </div>
              <h1 className="text-white font-black text-5xl md:text-6xl mb-5 leading-tight tracking-tight">
                Find Your<br/>
                <span className="text-rose italic font-light">Perfect Glow</span>
              </h1>
              <p className="text-white/60 text-lg mb-9 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Book top-rated Nigerian and Afro-Caribbean hair and beauty salons across the UK. Instant booking, verified reviews.
              </p>

              {/* Search bar */}
              <form action="/search" className="flex max-w-xl mx-auto lg:mx-0 bg-white rounded-2xl overflow-hidden shadow-2xl mb-7">
                <span className="pl-5 flex items-center text-ink-3">🔍</span>
                <input name="q" className="flex-1 min-w-0 px-4 py-4 text-sm outline-none text-ink placeholder:text-ink-3 bg-transparent"
                  placeholder="Search salons, services, cities…"/>
                <button type="submit" className="px-7 bg-rose text-white font-bold text-sm hover:bg-rose-dark transition-colors flex-shrink-0">
                  Search
                </button>
              </form>

              {/* City pills */}
              <p className="text-2xs font-bold uppercase tracking-widest text-white/40 mb-2.5">Popular Cities</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {popularCities.slice(0, 8).map(c => (
                  <Link key={c} href={`/location/${c.toLowerCase()}`}
                    className="px-3 py-1.5 border border-white/20 text-white/60 rounded-full text-xs font-medium hover:text-white hover:border-white/50 hover:bg-white/10 transition-all">
                    📍 {c}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side intentionally empty — the salon photo shows through here
                as the fading background image itself, not a separate boxed photo. */}
            <div className="hidden lg:block" aria-hidden="true"/>
          </div>
        </section>

        {/* ── STATS BAR (floats up over the hero) ─────────────────────────── */}
        <section className="container -mt-14 md:-mt-16 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl border border-bdr px-6 py-7 flex flex-wrap justify-center gap-x-10 gap-y-6 md:gap-x-16">
            {[
              ['🏪', `${salonCount || 100}+`, 'Verified Salons'],
              ['👥', `${userCount  || 500}+`, 'Happy Clients'],
              ['⭐', '4.9★',                  'Average Rating'],
              ['📅', 'Instant',               'Booking Confirmation'],
              ['🇬🇧', 'UK-wide',              'Coverage'],
            ].map(([icon, val, label]) => (
              <div key={label as string} className="text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="font-black text-xl text-ink">{val}</div>
                <div className="text-2xs text-ink-3 font-semibold uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ────────────────────────────────────────────────── */}
        <section className="container py-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-1">Browse by Category</p>
              <h2 className="text-3xl font-black">Every Service, Every Style</h2>
            </div>
            <Link href="/salons" className="text-rose text-sm font-bold hover:underline hidden sm:block">View all categories →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map(({ slug, label, emoji }, i) => (
              <Link key={slug} href={`/category/${slug}`}
                className="card card-body text-center group hover:border-rose hover:shadow-lg transition-all">
                <div className={`icon-badge w-14 h-14 text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-200 ${categoryTints[i % categoryTints.length]}`}>
                  {emoji}
                </div>
                <div className="font-bold text-sm mb-1">{label}</div>
                <div className="text-2xs text-ink-3">{categoryCounts[slug] || 0} salon{categoryCounts[slug] === 1 ? '' : 's'}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="bg-page-2 py-14">
          <div className="container">
            <div className="text-center mb-10">
              <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-2">Simple &amp; Fast</p>
              <h2 className="text-3xl font-black">How GlowNaija Works</h2>
            </div>
            <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-start max-w-4xl mx-auto">
              {howItWorks.map(({ step, title, desc, icon }, i) => (
                <Fragment key={step}>
                  <div className="text-center px-2">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-rose/30 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
                      {icon}
                    </div>
                    <div className="text-2xs font-black text-rose mb-2 uppercase tracking-widest">Step {step}</div>
                    <h3 className="font-black text-base mb-2">{title}</h3>
                    <p className="text-ink-3 text-sm leading-relaxed">{desc}</p>
                  </div>
                  {i < howItWorks.length - 1 && <div className="step-connector w-10" />}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── MEET GLOW AI ──────────────────────────────────────────────── */}
        <section className="container py-14">
          <div className="bg-gradient-to-r from-purple-900 to-ink rounded-3xl p-8 md:p-12 text-white overflow-hidden relative grid lg:grid-cols-2 gap-10 items-center">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 40%, #E8607A 0%, transparent 55%)'}}/>
            <div className="relative z-10 text-center lg:text-left">
              <div className="inline-block bg-white/10 border border-white/20 rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-widest mb-4">✦ New</div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">Meet Glow AI ✨</h2>
              <p className="text-white/70 text-base mb-7 max-w-md mx-auto lg:mx-0">
                Your personal Afro &amp; Caribbean beauty assistant. Get hair care tips, salon recommendations, and product suggestions for your hair type.
              </p>
              <div className="flex gap-3 justify-center lg:justify-start flex-wrap">
                <Link href="/chat" className="btn bg-rose text-white px-6 py-3 hover:bg-rose-dark">
                  Chat with Glow AI →
                </Link>
                <Link href="/stylist" className="btn border-2 border-white/30 text-white px-6 py-3 hover:bg-white/10">
                  Take the Quiz
                </Link>
              </div>
            </div>

            {/* Decorative chat mockup */}
            <div className="relative z-10 hidden lg:block">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-xs mx-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-bdr">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose flex items-center justify-center text-white text-xs">✦</div>
                    <div>
                      <p className="text-xs font-bold text-ink leading-none">Glow AI</p>
                      <p className="text-2xs text-gn leading-none mt-0.5">Online</p>
                    </div>
                  </div>
                  <span className="text-ink-3 text-xs">✕</span>
                </div>
                <div className="p-4 bg-page-2">
                  <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-xs text-ink shadow-sm max-w-[85%] mb-3">
                    Hi! I'm Glow AI. How can I help you today?
                  </div>
                  <div className="flex flex-col gap-2">
                    {['Recommend salons near me','Best hair care tips','Find products for my hair type'].map(s => (
                      <div key={s} className="bg-white/80 border border-bdr rounded-lg px-3 py-2 text-2xs text-ink-2 font-medium">{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURED SALONS ───────────────────────────────────────────── */}
        {(featured?.length || 0) > 0 && (
          <section className="container py-16">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-2xs font-bold uppercase tracking-widest text-gold mb-1">Featured</p>
                <h2 className="text-3xl font-black">Featured Salons</h2>
              </div>
              <Link href="/salons?featured=1" className="text-rose text-sm font-bold hover:underline hidden sm:block">View all salons →</Link>
            </div>
            <HomeCarousel
              items={featured!.map(s => <FeaturedSalonCard key={s.id} salon={s} isSaved={savedIds.has(s.id)} />)}
              perPage={1}
              gridClass=""
            />
          </section>
        )}

        {/* ── SHOP SECTION ──────────────────────────────────────────────── */}
        {(products?.length || 0) > 0 && (
          <section className="bg-page-2 py-12">
            <div className="container">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-1">Beauty Shop</p>
                  <h2 className="text-3xl font-black">Shop Top Products</h2>
                </div>
                <Link href="/shop" className="text-rose text-sm font-bold hover:underline hidden sm:block">Shop all products →</Link>
              </div>
              <HomeCarousel
                items={products!.map(p => <HomeProductCard key={p.id} product={p} />)}
                perPage={3}
                gridClass="grid grid-cols-1 sm:grid-cols-3 gap-4"
              />
            </div>
          </section>
        )}

        {/* ── EVENTS ────────────────────────────────────────────────────── */}
        {(events?.length || 0) > 0 && (
          <section className="container py-16">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-1">Upcoming</p>
                <h2 className="text-3xl font-black">Beauty Events</h2>
              </div>
              <Link href="/events" className="text-rose text-sm font-bold hover:underline hidden sm:block">All events →</Link>
            </div>
            <HomeCarousel
              items={events!.map(e => <HomeEventCard key={e.id} event={e} />)}
              perPage={2}
              gridClass="grid grid-cols-1 sm:grid-cols-2 gap-5"
            />
          </section>
        )}

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section className="bg-page-2 py-14">
          <div className="container">
            <div className="text-center mb-8">
              <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-2">Real Clients</p>
              <h2 className="text-3xl font-black">What Our Community Says</h2>
            </div>
            <Testimonials testimonials={testimonials}/>
          </div>
        </section>

        {/* ── SALONS NEAR YOU (single scrollable row of pills) ─────────────── */}
        <section className="container py-14">
          <div className="text-center mb-8">
            <p className="text-2xs font-bold uppercase tracking-widest text-rose mb-2">Nationwide</p>
            <h2 className="text-3xl font-black">Salons Near You</h2>
            <p className="text-ink-3 mt-2">GlowNaija covers salons across the UK</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.map(c => (
              <Link key={c} href={`/location/${c.toLowerCase()}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-bdr bg-white text-sm font-bold hover:border-rose hover:text-rose transition-all">
                📍 {c}
              </Link>
            ))}
            <Link href="/salons" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-page-2 text-sm font-bold text-ink-3 hover:text-rose transition-all">
              ⊞ View all cities
            </Link>
          </div>
        </section>

        {/* ── SALON OWNER CTA ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background image — fills the whole section */}
          <div className="absolute inset-0">
            <Image src="/assets/images/owners-salon.png" alt="Salon interior for owners" fill quality={90} sizes="100vw" className="object-cover"/>
          </div>
          {/* Fade overlay: opaque brand gradient on the left where the text sits,
              fading to fully transparent on the right so the photo shows through. */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose via-rose/95 md:via-purple-700/85 to-purple-700/20 md:to-transparent"/>

          <div className="container py-16 grid lg:grid-cols-2 gap-10 items-center relative z-10">
            <div className="text-center lg:text-left">
              <div className="inline-block bg-white/15 rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-widest text-white mb-4">🏪 For Salon Owners</div>
              <h2 className="text-white font-black text-3xl md:text-4xl mb-3">
                Own a Salon?<br/>List It Free Today
              </h2>
              <p className="text-white/70 text-base mb-7 max-w-md mx-auto lg:mx-0">
                Join hundreds of Nigerian and Afro-Caribbean salon owners already growing their business on GlowNaija. Free to list, instant visibility.
              </p>
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap mb-8">
                <Link href="/business" className="btn bg-white text-rose hover:bg-white/90 font-bold px-7 py-3">
                  List My Salon Free →
                </Link>
                <Link href="/salons" className="btn border-2 border-white/40 text-white hover:bg-white/10 px-7 py-3">
                  Browse All Salons
                </Link>
              </div>
              <div className="flex gap-3 justify-center lg:justify-start">
                {[['🎫','Free listing'],['⚡','Instant bookings'],['🕐','24/7 visibility']].map(([icon, label]) => (
                  <div key={label} className="flex flex-col items-center lg:items-start gap-1.5 text-white/90 text-2xs font-semibold text-center lg:text-left w-24">
                    <span className="icon-badge w-9 h-9 bg-white/15 text-base">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side intentionally empty — the salon photo shows through here
                as the fading background image itself, not a separate boxed photo. */}
            <div className="hidden lg:block" aria-hidden="true"/>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
