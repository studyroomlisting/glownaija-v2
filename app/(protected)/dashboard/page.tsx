// @ts-nocheck
import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import Link               from 'next/link'
import { fmtPrice, formatDuration } from '@/lib/utils'
import StatsCard          from '@/components/dashboard/StatsCard'
import PhotoUpload        from '@/components/dashboard/PhotoUpload'
import ServiceRow         from '@/components/salon/ServiceRow'
import ReviewCard         from '@/components/salon/ReviewCard'
import { addService, updateProfile, updateHours, updateEnquiryStatus } from '@/lib/actions/dashboard'
import { updateBookingStatus } from '@/lib/actions/bookings'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string; msg?: string; bstatus?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: salonRaw } = await supabase.from('salons').select('*').eq('owner_id', user.id).single()
  if (!salon) redirect('/business')

  const tab      = searchParams.tab    || 'overview'
  const bfilter  = searchParams.bstatus || 'all'

  // ── Fetch all data ───────────────────────────────────────────────────────
  const [
    { data: services  },
    { data: bookings  },
    { data: hours     },
    { data: enquiries },
    { data: reviews   },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('salon_id', salon.id).eq('is_active', true).order('sort_order').order('name'),
    supabase.from('bookings').select('*,services(name,price),profiles(first_name,last_name,email,phone)').eq('salon_id', salon.id).order('booking_date', {ascending:false}).limit(100),
    supabase.from('salon_opening_hours').select('*').eq('salon_id', salon.id).order('day_of_week'),
    supabase.from('enquiries').select('*').eq('salon_id', salon.id).order('created_at', {ascending:false}).limit(50),
    supabase.from('reviews').select('*,profiles(first_name,last_name)').eq('salon_id', salon.id).order('created_at', {ascending:false}).limit(20),
  ])

  // ── Derived stats ────────────────────────────────────────────────────────
  const today    = new Date().toISOString().split('T')[0]
  const thisMonth= new Date().toISOString().slice(0, 7)
  const lastMonth= new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().slice(0,7)

  const upcoming  = bookings?.filter(b => ['pending','confirmed'].includes(b.status) && b.booking_date >= today) || []
  const unread    = enquiries?.filter(e => e.status === 'unread').length || 0
  const revMonth  = bookings?.filter(b => b.deposit_paid && b.booking_date.startsWith(thisMonth)).reduce((s,b) => s + b.deposit_amount, 0) || 0
  const revLast   = bookings?.filter(b => b.deposit_paid && b.booking_date.startsWith(lastMonth)).reduce((s,b) => s + b.deposit_amount, 0) || 0
  const revTrend  = revLast > 0 ? Math.round((revMonth - revLast) / revLast * 100) : 0

  const bFiltered = bfilter === 'all' ? bookings : bookings?.filter(b => b.status === bfilter)

  // ── Monthly analytics ────────────────────────────────────────────────────
  const monthlyData: Record<string, { bookings: number; revenue: number }> = {}
  bookings?.forEach(b => {
    const mo = b.booking_date.slice(0, 7)
    if (!monthlyData[mo]) monthlyData[mo] = { bookings: 0, revenue: 0 }
    monthlyData[mo].bookings++
    if (b.deposit_paid) monthlyData[mo].revenue += b.deposit_amount
  })
  const last6months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d.toISOString().slice(0, 7)
  })

  // ── Hours map ────────────────────────────────────────────────────────────
  const hoursMap = Object.fromEntries(hours?.map(h => [h.day_of_week, h]) || [])
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today_dow = new Date().getDay()

  // ── Service categories ───────────────────────────────────────────────────
  const svcGroups = services?.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, typeof services>) || {}

  // ── Booking status breakdown ─────────────────────────────────────────────
  const statusBreakdown = ['pending','confirmed','completed','cancelled','no_show'].map(st => ({
    status: st,
    count: bookings?.filter(b => b.status === st).length || 0,
  }))

  // ── Profile completion ───────────────────────────────────────────────────
  const steps = [
    { done: (salon.description?.length || 0) > 30, label: 'Add description', tab: 'profile' },
    { done: (salon.images?.length || 0) > 0,        label: 'Add photos',      tab: 'profile' },
    { done: (services?.length || 0) > 0,            label: 'Add services',    tab: 'services' },
    { done: !!salon.phone,                           label: 'Add phone',       tab: 'profile' },
    { done: !!salon.instagram,                       label: 'Add Instagram',   tab: 'profile' },
    { done: (hours?.length || 0) > 0,               label: 'Set hours',       tab: 'hours' },
  ]
  const completion = Math.round(steps.filter(s => s.done).length / steps.length * 100)

  const tabs = [
    { id:'overview',   label:'📊 Overview' },
    { id:'analytics',  label:'📈 Analytics' },
    { id:'profile',    label:'🏪 Profile' },
    { id:'services',   label:'📋 Services', badge: services?.length },
    { id:'hours',      label:'🕐 Hours' },
    { id:'bookings',   label:'📅 Bookings', badge: upcoming.length || undefined },
    { id:'enquiries',  label:'📩 Enquiries', badge: unread || undefined },
    { id:'reviews',    label:'⭐ Reviews', badge: reviews?.length },
  ]

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  }

  const svcCategories = ['braids','wigs','locs','makeup','nails','skincare','natural','colour','barber','wax','bridal']
  const svcDurations  = [15,30,45,60,75,90,120,150,180,210,240,300,360,420,480]
  const durLabel = (m: number) => m >= 60 ? `${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}` : `${m}m`

  return (
    <div>
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-ink to-purple-900 py-5">
        <div className="container flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="text-white/40 text-2xs uppercase tracking-widest mb-0.5">Salon Dashboard</p>
            <h1 className="text-white text-xl font-black">{salon.name} {salon.emoji}</h1>
            <p className="text-white/40 text-xs">📍 {salon.area}, {salon.city}{salon.postcode ? ` · ${salon.postcode}` : ''} · ★{salon.rating || '—'} · {salon.review_count} reviews</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {salon.slug && (
              <Link href={`/salon/${salon.slug}`} target="_blank" className="btn btn-sm border-white/30 text-white border-2 bg-transparent hover:bg-white/10 text-xs">
                👁 View Listing
              </Link>
            )}
            <span className={`btn btn-sm text-xs text-white border-2 ${salon.is_open ? 'border-gn bg-gn/20' : 'border-white/20 bg-white/10'}`}>
              {salon.is_open ? '● Open' : '● Closed'}
            </span>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Flash message */}
        {searchParams.msg && (
          <div className="alert-success mb-4">
            {searchParams.msg === 'profile_saved'  && '✅ Profile saved!'}
            {searchParams.msg === 'service_added'  && '✅ Service added!'}
            {searchParams.msg === 'service_deleted'&& 'Service removed.'}
            {searchParams.msg === 'hours_saved'    && '✅ Opening hours updated!'}
          </div>
        )}

        {/* Profile completion */}
        {completion < 100 && (
          <div className="card card-body mb-5 border-gold bg-yellow-50">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-sm">⚡ Profile {completion}% complete</p>
              <span className="text-xs text-ink-3">{steps.filter(s=>s.done).length}/{steps.length} steps</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gold rounded-full transition-all" style={{width:`${completion}%`}}/>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map(s => (
                <Link key={s.label} href={`/dashboard?tab=${s.tab}`}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${s.done ? 'bg-green-100 text-gn' : 'bg-rose-100 text-rose'}`}>
                  {s.done ? '✓' : '+'} {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs mb-6">
          {tabs.map(t => (
            <Link key={t.id} href={`/dashboard?tab=${t.id}`}
              className={`tab flex items-center gap-1.5 ${tab === t.id ? 'active' : ''}`}>
              {t.label}
              {t.badge ? (
                <span className={`text-2xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${tab === t.id ? 'bg-white/25 text-white' : 'bg-rose text-white'}`}>
                  {t.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid-4">
              <StatsCard icon="📅" label="Upcoming" value={upcoming.length}/>
              <StatsCard icon="💰" label="Revenue (month)" value={fmtPrice(revMonth)}
                trend={revTrend !== 0 ? `${revTrend > 0 ? '↑' : '↓'} ${Math.abs(revTrend)}% vs last month` : undefined}
                trendUp={revTrend > 0}/>
              <StatsCard icon="⭐" label="Rating" value={salon.rating ? `${salon.rating} (${salon.review_count})` : 'No reviews'}/>
              <StatsCard icon="📩" label="Unread Enquiries" value={unread}/>
            </div>

            <div className="grid-2">
              <div className="card card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold">Upcoming Bookings</h2>
                  <Link href="/dashboard?tab=bookings" className="text-xs text-rose font-bold">View all →</Link>
                </div>
                {!upcoming.length ? (
                  <div className="text-center py-8 text-ink-3">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="text-sm font-semibold mb-1">No upcoming bookings</p>
                    <p className="text-xs">Make sure services and hours are set up</p>
                    <div className="flex gap-2 justify-center mt-3">
                      <Link href="/dashboard?tab=services" className="btn btn-primary btn-sm">Add Services</Link>
                      <Link href="/dashboard?tab=hours"    className="btn btn-outline btn-sm">Set Hours</Link>
                    </div>
                  </div>
                ) : upcoming.slice(0, 6).map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-bdr last:border-0">
                    <div>
                      <p className="font-semibold text-sm">{(b.profiles as any)?.first_name} {(b.profiles as any)?.last_name}</p>
                      <p className="text-xs text-ink-3">{(b.services as any)?.name || 'Appointment'} · {fmtDate(b.booking_date)} {b.time_slot}</p>
                    </div>
                    <span className={`status status-${b.status} text-xs`}>{b.status}</span>
                  </div>
                ))}
              </div>

              <div className="card card-body">
                <h2 className="font-bold mb-4">Quick Actions</h2>
                <div className="space-y-2.5">
                  {[
                    ['/dashboard?tab=profile',  '✏️', 'Edit Profile & Photos'],
                    ['/dashboard?tab=services', '➕', 'Add a Service'],
                    ['/dashboard?tab=hours',    '🕐', 'Update Opening Hours'],
                    ['/dashboard?tab=analytics','📈', 'View Analytics'],
                    ['/dashboard?tab=enquiries','📩', `View Enquiries${unread ? ` (${unread} new)` : ''}`],
                    [salon.slug ? `/salon/${salon.slug}` : '/dashboard', '👁', 'View Public Listing'],
                  ].map(([href, icon, label]) => (
                    <Link key={label as string} href={href as string} target={href!.startsWith('/salon') ? '_blank' : undefined}
                      className="flex items-center gap-3 p-3 rounded-xl bg-page-2 hover:bg-rose-50 hover:text-rose transition-all text-sm font-semibold">
                      <span>{icon}</span>{label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ═════════════════════════════════════════════════ */}
        {tab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid-2">
              {/* Revenue chart */}
              <div className="card card-body">
                <h2 className="font-bold mb-1">Revenue — Last 6 Months</h2>
                <p className="text-2xl font-black mb-1">{fmtPrice(bookings?.filter(b=>b.deposit_paid).reduce((s,b)=>s+b.deposit_amount,0)||0)}</p>
                <p className="text-xs text-ink-3 mb-4">Total from deposits</p>
                {last6months.some(m => monthlyData[m]?.revenue) ? (
                  <div>
                    <div className="flex items-end gap-2 h-24 mb-2">
                      {last6months.map(mo => {
                        const rev = monthlyData[mo]?.revenue || 0
                        const maxRev = Math.max(...last6months.map(m => monthlyData[m]?.revenue || 0), 1)
                        const h = Math.max(4, Math.round(rev / maxRev * 88))
                        const isCurrent = mo === thisMonth
                        return (
                          <div key={mo} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-3xs text-ink-3">£{Math.round(rev/100)}</span>
                            <div className="w-full rounded-t-md transition-all" style={{height:`${h}px`, background: isCurrent ? 'var(--rose)' : 'var(--ink3)'}}/>
                            <span className="text-3xs text-ink-3">{new Date(mo+'-01').toLocaleDateString('en-GB',{month:'short'})}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-ink-3 text-sm">No revenue data yet</div>
                )}
              </div>

              {/* Bookings chart */}
              <div className="card card-body">
                <h2 className="font-bold mb-1">Bookings — Last 6 Months</h2>
                <p className="text-2xl font-black mb-1">{bookings?.length || 0}</p>
                <p className="text-xs text-ink-3 mb-4">Total bookings</p>
                {last6months.some(m => monthlyData[m]?.bookings) ? (
                  <div className="flex items-end gap-2 h-24 mb-2">
                    {last6months.map(mo => {
                      const cnt = monthlyData[mo]?.bookings || 0
                      const maxCnt = Math.max(...last6months.map(m => monthlyData[m]?.bookings || 0), 1)
                      const h = Math.max(4, Math.round(cnt / maxCnt * 88))
                      const isCurrent = mo === thisMonth
                      return (
                        <div key={mo} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-3xs text-ink-3">{cnt}</span>
                          <div className="w-full rounded-t-md" style={{height:`${h}px`, background: isCurrent ? 'var(--ink)' : 'var(--border)'}}/>
                          <span className="text-3xs text-ink-3">{new Date(mo+'-01').toLocaleDateString('en-GB',{month:'short'})}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-ink-3 text-sm">No booking data yet</div>
                )}
              </div>
            </div>

            <div className="grid-2">
              {/* Top services */}
              <div className="card card-body">
                <h2 className="font-bold mb-4">Top Services (by bookings)</h2>
                {!services?.length ? (
                  <div className="text-center py-6 text-ink-3 text-sm">No services yet</div>
                ) : services.slice(0, 5).map(s => {
                  const cnt = bookings?.filter(b => b.service_id === s.id).length || 0
                  const maxCnt = Math.max(...(services.map(sv => bookings?.filter(b => b.service_id === sv.id).length || 0)), 1)
                  return (
                    <div key={s.id} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{s.emoji} {s.name}</span>
                        <span className="text-ink-3">{cnt} bookings · {fmtPrice(s.price)}</span>
                      </div>
                      <div className="h-1.5 bg-page-2 rounded-full overflow-hidden">
                        <div className="h-full bg-rose rounded-full" style={{width:`${Math.round(cnt/maxCnt*100)}%`}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Booking status breakdown */}
              <div className="card card-body">
                <h2 className="font-bold mb-4">Booking Status Breakdown</h2>
                {!bookings?.length ? (
                  <div className="text-center py-6 text-ink-3 text-sm">No bookings yet</div>
                ) : statusBreakdown.map(({ status, count }) => {
                  const pct = bookings!.length > 0 ? Math.round(count / bookings!.length * 100) : 0
                  const colors: Record<string,string> = {pending:'#D4AF37',confirmed:'#3B82F6',completed:'#10B981',cancelled:'#8C7B6E',no_show:'#E8607A'}
                  return (
                    <div key={status} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold capitalize">{status.replace('_',' ')}</span>
                        <span className="text-ink-3">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-page-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`, background:colors[status]}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROFILE ═══════════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <div className="grid-2 items-start">
            <div className="card card-body">
              <h2 className="font-bold text-lg mb-5">Salon Details</h2>
              <form action={updateProfile} className="space-y-4">
                <div>
                  <label className="label">Salon Name *</label>
                  <input name="name" className="input" defaultValue={salon.name} required maxLength={100}/>
                </div>
                <div>
                  <label className="label">Description <span className="font-normal text-ink-3">(recommended)</span></label>
                  <textarea name="description" className="input" rows={4} maxLength={1500}
                    placeholder="e.g. Specialist in knotless braids and natural hair in Peckham…"
                    defaultValue={salon.description || ''}/>
                </div>
                <div>
                  <label className="label">Street Address</label>
                  <input name="address" className="input" placeholder="e.g. 45 Rye Lane" defaultValue={salon.address || ''}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Area *</label>
                    <input name="area" className="input" placeholder="e.g. Peckham" defaultValue={salon.area} required/>
                  </div>
                  <div>
                    <label className="label">Postcode</label>
                    <input name="postcode" className="input" placeholder="SE15 5DT" defaultValue={salon.postcode || ''}/>
                  </div>
                </div>
                <div>
                  <label className="label">City</label>
                  <select name="city" className="input">
                    {['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other'].map(c => (
                      <option key={c} value={c} selected={salon.city === c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Phone</label>
                    <input name="phone" type="tel" className="input" defaultValue={salon.phone || ''} placeholder="+44 7700 900000"/>
                  </div>
                  <div>
                    <label className="label">Contact Email</label>
                    <input name="email" type="email" className="input" defaultValue={salon.email || ''}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">@</span>
                      <input name="instagram" className="input pl-7" defaultValue={salon.instagram || ''} placeholder="yoursalon"/>
                    </div>
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input name="website" className="input" type="url" defaultValue={salon.website || ''} placeholder="https://"/>
                  </div>
                </div>
                <div>
                  <label className="label">Tags <span className="font-normal text-ink-3">(comma separated)</span></label>
                  <input name="tags" className="input" placeholder="e.g. 4C hair, knotless braids, melanin skin"
                    defaultValue={salon.tags?.join(', ') || ''}/>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input name="is_open" type="checkbox" defaultChecked={salon.is_open} className="w-4 h-4 accent-rose"/>
                    <span className="text-sm font-semibold">Open for bookings right now</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input name="accepts_online_bookings" type="checkbox" defaultChecked={salon.accepts_online_bookings} className="w-4 h-4 accent-rose"/>
                    <span className="text-sm font-semibold">Accept online bookings via GlowNaija</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary w-full justify-center py-3.5">Save Profile →</button>
              </form>
            </div>

            <div className="card card-body">
              <h2 className="font-bold text-lg mb-2">Salon Photos</h2>
              <p className="text-sm text-ink-3 mb-4">Photos increase booking rates by 3×. Add at least 3 of your best work.</p>
              <PhotoUpload salonId={salon.id} images={salon.images || []} onUpdate={() => {}}/>
            </div>
          </div>
        )}

        {/* ══ SERVICES ══════════════════════════════════════════════════ */}
        {tab === 'services' && (
          <div className="grid-2 items-start">
            {/* Add service form */}
            <div className="card card-body border-gn">
              <h2 className="font-bold text-lg mb-5">➕ Add Service</h2>
              <form action={addService} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Icon</label>
                    <select name="svc_emoji" className="input text-xl">
                      {['✂️','👑','🌿','💄','💅','🧴','🌱','🎨','💆','💈','🧖','💍','👁️','🪮'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select name="svc_category" className="input">
                      {svcCategories.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Service Name *</label>
                  <input name="svc_name" className="input" required maxLength={80} placeholder="e.g. Knotless Box Braids (Medium)"/>
                </div>
                <div>
                  <label className="label">Description <span className="font-normal text-ink-3">(optional)</span></label>
                  <input name="svc_desc" className="input" maxLength={200} placeholder="e.g. Any length, includes wash & blow dry"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Price (£) *</label>
                    <input name="svc_price" type="number" className="input" min="1" max="9999" step="0.01" required placeholder="e.g. 120"/>
                  </div>
                  <div>
                    <label className="label">Duration</label>
                    <select name="svc_duration" className="input">
                      {svcDurations.map(d => (
                        <option key={d} value={d} selected={d===60}>{durLabel(d)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-green w-full justify-center py-3.5">Add Service →</button>
              </form>
            </div>

            {/* Service list */}
            <div className="card card-body">
              <h2 className="font-bold text-lg mb-4">Your Services ({services?.length || 0})</h2>
              {!services?.length ? (
                <div className="text-center py-12 text-ink-3">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="font-bold mb-1">No services yet</p>
                  <p className="text-sm">Add your first service to start receiving bookings</p>
                </div>
              ) : (
                <div>
                  {Object.entries(svcGroups).map(([cat, svcs]) => (
                    <div key={cat}>
                      {Object.keys(svcGroups).length > 1 && (
                        <p className="text-2xs font-bold uppercase tracking-widest text-ink-3 py-2 border-b border-bdr mb-1">{cat}</p>
                      )}
                      {svcs!.map(s => (
                        <div key={s.id} className="flex justify-between items-center py-3 border-b border-bdr last:border-0">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl flex-shrink-0">{s.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{s.name}</p>
                              {s.description && <p className="text-xs text-ink-3 truncate">{s.description}</p>}
                              <p className="text-xs text-ink-3">{durLabel(s.duration_minutes)} · {s.category}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-black">{fmtPrice(s.price)}</p>
                            <form action={async () => {
                              'use server'
                              const { createClient } = await import('@/lib/supabase/server')
                              const sb = await createClient()
                              await sb.from('services').update({is_active:false}).eq('id',s.id)
                              redirect('/dashboard?tab=services&msg=service_deleted')
                            }}>
                              <button className="text-xs text-rose hover:underline mt-0.5">Remove</button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ HOURS ═════════════════════════════════════════════════════ */}
        {tab === 'hours' && (
          <div className="card card-body max-w-lg">
            <h2 className="font-bold text-lg mb-2">Opening Hours</h2>
            <p className="text-sm text-ink-3 mb-5">These control which booking slots appear on your listing.</p>
            <form action={updateHours} className="space-y-1">
              {days.map((day, d) => {
                const h      = hoursMap[d]
                const closed = h?.is_closed ?? (d === 0)
                const isToday = d === today_dow
                return (
                  <div key={d} className={`flex items-center gap-3 py-3 border-b border-bdr last:border-0 ${isToday ? 'bg-rose-50 px-3 -mx-3 rounded-xl' : ''}`}>
                    <div className={`w-24 flex-shrink-0 text-sm ${isToday ? 'font-black text-rose' : 'font-medium'}`}>
                      {day}{isToday ? ' ◀' : ''}
                    </div>
                    <label className="flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
                      <input name={`closed[${d}]`} type="checkbox" defaultChecked={closed} className="w-4 h-4 accent-rose"/>
                      <span className="text-xs text-ink-3">Closed</span>
                    </label>
                    <input name={`open[${d}]`} type="time" defaultValue={h?.open_time?.substring(0,5) || '09:00'}
                      className="input flex-1 py-1.5 text-sm min-w-0"/>
                    <span className="text-ink-3 text-xs flex-shrink-0">–</span>
                    <input name={`close[${d}]`} type="time" defaultValue={h?.close_time?.substring(0,5) || '18:00'}
                      className="input flex-1 py-1.5 text-sm min-w-0"/>
                  </div>
                )
              })}
              <button type="submit" className="btn btn-primary w-full justify-center py-3.5 mt-5">Save Opening Hours →</button>
            </form>
          </div>
        )}

        {/* ══ BOOKINGS ══════════════════════════════════════════════════ */}
        {tab === 'bookings' && (
          <div>
            {/* Filter bar */}
            <div className="flex gap-2 flex-wrap mb-5 items-center">
              {['all','pending','confirmed','completed','cancelled','no_show'].map(st => (
                <Link key={st} href={`/dashboard?tab=bookings&bstatus=${st}`}
                  className={`btn btn-sm text-xs ${bfilter === st ? 'bg-ink text-white' : 'bg-page-2 text-ink-2 hover:bg-page'}`}>
                  {st === 'all' ? 'All' : st.replace('_',' ').replace(/^\w/,c=>c.toUpperCase())}
                  {' '}({st === 'all' ? bookings?.length : bookings?.filter(b=>b.status===st).length})
                </Link>
              ))}
            </div>

            {!bFiltered?.length ? (
              <div className="text-center py-16 text-ink-3">
                <p className="text-5xl mb-3">📅</p>
                <p className="font-bold text-lg mb-2">{bfilter === 'all' ? 'No bookings yet' : `No ${bfilter.replace('_',' ')} bookings`}</p>
                {bfilter === 'all' && (
                  <div className="flex gap-2 justify-center mt-3">
                    <Link href="/dashboard?tab=services" className="btn btn-primary btn-sm">Add Services</Link>
                    <Link href="/dashboard?tab=hours"    className="btn btn-outline btn-sm">Set Hours</Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {bFiltered.map(b => (
                  <div key={b.id} className="card card-body">
                    <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                      <div>
                        <p className="font-bold">{(b.profiles as any)?.first_name} {(b.profiles as any)?.last_name}</p>
                        <p className="text-sm text-ink-2">{(b.services as any)?.name || 'Appointment'}</p>
                        <p className="text-sm text-ink-3">📅 {fmtDate(b.booking_date)} at {b.time_slot}</p>
                        <div className="flex gap-3 flex-wrap mt-1">
                          {(b.profiles as any)?.email && (
                            <a href={`mailto:${(b.profiles as any).email}`} className="text-xs text-rose">📧 {(b.profiles as any).email}</a>
                          )}
                          {(b.profiles as any)?.phone && (
                            <a href={`tel:${(b.profiles as any).phone}`} className="text-xs text-rose">📞 {(b.profiles as any).phone}</a>
                          )}
                        </div>
                        <p className="text-xs text-ink-3 mt-1">
                          Ref: <strong>{b.reference}</strong> ·{' '}
                          {b.deposit_paid
                            ? <span className="text-gn font-semibold">✓ Deposit {fmtPrice(b.deposit_amount)} paid</span>
                            : <span className="text-gold font-semibold">⏳ Deposit pending</span>
                          }
                        </p>
                      </div>
                      <span className={`status status-${b.status}`}>{b.status.replace('_',' ')}</span>
                    </div>
                    {['pending','confirmed'].includes(b.status) && (
                      <div className="flex gap-2 flex-wrap pt-3 border-t border-bdr">
                        {b.status === 'pending' && (
                          <form action={async () => { 'use server'; await updateBookingStatus(b.id, 'confirmed'); redirect('/dashboard?tab=bookings') }}>
                            <button className="btn btn-green btn-sm">✓ Confirm</button>
                          </form>
                        )}
                        <form action={async () => { 'use server'; await updateBookingStatus(b.id, 'completed'); redirect('/dashboard?tab=bookings') }}>
                          <button className="btn btn-sm bg-blue-500 text-white hover:bg-blue-600">✓ Complete</button>
                        </form>
                        <form action={async () => { 'use server'; await updateBookingStatus(b.id, 'no_show'); redirect('/dashboard?tab=bookings') }}>
                          <button className="btn btn-outline btn-sm">No Show</button>
                        </form>
                        <form action={async () => { 'use server'; await updateBookingStatus(b.id, 'cancelled'); redirect('/dashboard?tab=bookings') }}>
                          <button className="btn btn-outline btn-sm text-rose border-rose/50 hover:border-rose">Cancel</button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ENQUIRIES ═════════════════════════════════════════════════ */}
        {tab === 'enquiries' && (
          <div>
            {/* Status summary */}
            <div className="flex gap-2 flex-wrap mb-5">
              {(['unread','read','replied','archived'] as const).map(st => {
                const cnt = enquiries?.filter(e=>e.status===st).length || 0
                if (!cnt) return null
                return (
                  <span key={st} className="px-3 py-1 rounded-full bg-page-2 text-xs font-bold text-ink-3">
                    {st.charAt(0).toUpperCase()+st.slice(1)}: {cnt}
                  </span>
                )
              })}
            </div>

            {!enquiries?.length ? (
              <div className="text-center py-16 text-ink-3">
                <p className="text-5xl mb-3">📩</p>
                <p className="font-bold text-lg">No enquiries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enquiries.filter(e => e.status !== 'archived').map(e => (
                  <div key={e.id} className={`card card-body ${e.status === 'unread' ? 'border-l-4 border-l-rose' : ''}`}>
                    <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                      <div>
                        {e.status === 'unread' && (
                          <span className="badge-pill bg-rose text-white text-2xs mb-2 block w-fit">● New</span>
                        )}
                        <p className="font-bold">{e.name}</p>
                        <div className="flex gap-3 flex-wrap mt-0.5">
                          <a href={`mailto:${e.email}`} className="text-xs text-rose">📧 {e.email}</a>
                          {e.phone && <a href={`tel:${e.phone}`} className="text-xs text-ink-3">📞 {e.phone}</a>}
                        </div>
                        <p className="text-xs text-ink-3 mt-0.5">{new Date(e.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      <div className="flex gap-2">
                        {e.status === 'unread' && (
                          <form action={async () => { 'use server'; await updateEnquiryStatus(e.id, 'read'); redirect('/dashboard?tab=enquiries') }}>
                            <button className="btn btn-outline btn-sm text-xs">Mark Read</button>
                          </form>
                        )}
                        <form action={async () => { 'use server'; await updateEnquiryStatus(e.id, 'archived'); redirect('/dashboard?tab=enquiries') }}>
                          <button className="btn btn-outline btn-sm text-xs text-ink-3">Archive</button>
                        </form>
                      </div>
                    </div>
                    {e.subject && <p className="font-semibold text-sm mb-2">{e.subject}</p>}
                    <div className="bg-page-2 rounded-xl p-3 mb-3 text-sm text-ink-2 leading-relaxed">{e.message}</div>
                    <a href={`mailto:${e.email}?subject=Re: ${encodeURIComponent(e.subject || 'Your Enquiry')}&body=${encodeURIComponent(`Hi ${e.name},\n\nThank you for enquiring about ${salon.name}. `)}`}
                      className="btn btn-primary btn-sm">
                      Reply by Email →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ REVIEWS ═══════════════════════════════════════════════════ */}
        {tab === 'reviews' && (
          <div>
            {/* Rating summary */}
            <div className="card card-body mb-5 flex items-center gap-5 flex-wrap">
              <div className="text-center">
                <p className="text-5xl font-black text-gold">{salon.rating || '—'}</p>
                <div className="text-gold text-xl">{salon.rating ? '★'.repeat(Math.round(salon.rating)) : ''}</div>
                <p className="text-xs text-ink-3 mt-1">{salon.review_count} review{salon.review_count !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 min-w-0">
                {[5,4,3,2,1].map(star => {
                  const cnt = reviews?.filter(r => r.rating === star).length || 0
                  const pct = reviews?.length ? Math.round(cnt / reviews.length * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-ink-3 w-6 text-right">{star}★</span>
                      <div className="flex-1 h-1.5 bg-page-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-xs text-ink-3 w-8">{pct}%</span>
                    </div>
                  )
                })}
              </div>
              {salon.slug && (
                <Link href={`/salon/${salon.slug}#reviews`} target="_blank" className="btn btn-outline btn-sm self-start">
                  View on Listing →
                </Link>
              )}
            </div>

            {!reviews?.length ? (
              <div className="text-center py-12 text-ink-3">
                <p className="text-5xl mb-3">⭐</p>
                <p className="font-bold text-lg mb-1">No reviews yet</p>
                <p className="text-sm">Reviews appear after clients complete bookings and leave feedback</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <ReviewCard key={r.id} review={{...r, ...(r.profiles as any)}} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
