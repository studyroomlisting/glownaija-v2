// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Testimonials from '@/components/layout/Testimonials'

export default async function AboutPage() {
  const supabase = await createClient()
  let salonCount = 0, userCount = 0, bookingCount = 0
  try {
    const [salonsRes, usersRes, bookingsRes] = await Promise.all([
      supabase.from('salons').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('listing_status', 'approved'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
    ])
    salonCount   = salonsRes?.count   || 0
    userCount    = usersRes?.count    || 0
    bookingCount = bookingsRes?.count || 0
  } catch { /* non-fatal — page still renders with fallback stats below */ }

  return (
    <div>
      {/* Hero */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="badge-pill bg-rose-100 text-rose text-xs font-bold mb-4 inline-flex items-center gap-1">🛡️ About Us</span>
            <h1 className="text-4xl font-black leading-tight mb-3">
              Empowering beauty.<br/><span className="text-rose">Connecting you.</span>
            </h1>
            <p className="text-ink-3 text-base mb-8 max-w-md">
              GlowNaija is the UK's trusted platform to discover top salons, book appointments, explore beauty services, and shop your favourites — all in one place.
            </p>
            <div className="flex gap-8">
              {[
                ['🏅', `${salonCount ? `${salonCount}+` : '1,000+'}`, 'Top Salons'],
                ['👥', `${userCount ? `${Math.floor(userCount/1000)}K+` : '50K+'}`, 'Happy Customers'],
                ['📅', `${bookingCount ? `${Math.floor(bookingCount/1000)}K+` : '100K+'}`, 'Appointments Booked'],
              ].map(([icon, num, label]) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center text-base flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-black text-lg leading-none">{num}</p>
                    <p className="text-2xs text-ink-3 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative image collage — swap for real photography when available */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-3 h-96">
            <div className="rounded-3xl bg-gradient-to-br from-rose/20 via-page-2 to-gold/20 flex items-center justify-center text-7xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{backgroundImage:'radial-gradient(circle at 30% 20%, #E8607A 0%, transparent 55%), radial-gradient(circle at 75% 75%, #D4AF37 0%, transparent 50%)'}}/>
              <span className="relative">💇🏾‍♀️</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex-1 rounded-3xl bg-gradient-to-br from-ink to-purple-900 flex items-center justify-center text-5xl">💈</div>
              <div className="flex-1 rounded-3xl bg-gradient-to-br from-gold/20 to-rose-50 flex items-center justify-center text-5xl">🧴</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission / Vision / Values */}
      <div className="bg-rose-50 py-12">
        <div className="container grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rose-200 gap-8 md:gap-0">
          {[
            ['🎯', 'Our Mission', 'To empower beauty professionals and make premium beauty services accessible to everyone across the UK.'],
            ['👁️', 'Our Vision', 'To be the leading beauty and wellness ecosystem for the diaspora, connecting people to the best in beauty.'],
          ].map(([icon, title, desc], i) => (
            <div key={title} className={`text-center px-6 ${i > 0 ? 'md:pt-0 pt-8' : ''}`}>
              <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl mx-auto mb-4">{icon}</span>
              <h3 className="font-black text-lg mb-2">{title}</h3>
              <p className="text-sm text-ink-3">{desc}</p>
            </div>
          ))}
          <div className="text-center px-6 pt-8 md:pt-0">
            <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl mx-auto mb-4">❤️</span>
            <h3 className="font-black text-lg mb-3">Our Values</h3>
            <ul className="text-sm text-ink-3 space-y-1.5 inline-block text-left">
              {['Trust & Transparency', 'Quality & Excellence', 'Customer First', 'Community Growth'].map(v => (
                <li key={v} className="flex items-center gap-2"><span className="text-gn">✓</span>{v}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Why choose */}
      <div className="container py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black mb-1">Why Choose <span className="text-rose">GlowNaija?</span></h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['🔍', 'Discover Top Salons', 'Find verified salons near you with real reviews and photos.'],
            ['📅', 'Easy Booking', 'Book appointments in just a few taps. Fast, simple & secure.'],
            ['🛍️', 'Shop Beauty Products', 'Explore and buy genuine beauty products from trusted brands.'],
            ['✨', 'Glow AI', 'Get personalised beauty recommendations just for you.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card card-body text-center">
              <span className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-xl mx-auto mb-3">{icon}</span>
              <p className="font-bold text-sm mb-1.5">{title}</p>
              <p className="text-xs text-ink-3">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-page-2 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black">Loved by <span className="text-rose">Thousands</span></h2>
        </div>
        <Testimonials/>
      </div>

      {/* Newsletter */}
      <div className="bg-rose-50 py-12">
        <div className="container flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-rose font-black text-xl mb-1">Join the Glow Community</p>
            <p className="text-ink-3 text-sm">Stay updated with beauty tips, exclusive offers, and the latest from GlowNaija.</p>
          </div>
          <form onSubmit={e => e.preventDefault()} className="flex gap-2 w-full sm:w-auto">
            <input type="email" required placeholder="Enter your email" className="input flex-1 sm:w-64 bg-white"/>
            <button type="submit" className="btn btn-primary flex-shrink-0">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  )
}
