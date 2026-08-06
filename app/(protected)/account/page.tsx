// @ts-nocheck
import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import Link               from 'next/link'
import { fmtPrice }       from '@/lib/utils'
import { cancelBooking }  from '@/lib/actions/bookings'
import { updateProfile }  from '@/lib/actions/account'

export const dynamic = 'force-dynamic'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { tab?: string; msg?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/account')

  const tab = searchParams.tab || 'overview'

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [
    { data: profileRaw   },
    { data: bookingsRaw  },
    { data: ordersRaw    },
    { data: savedSalonsRaw },
    { data: savedProductsRaw },
    { data: notificationsRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings')
      .select('*,salons(name,emoji,slug,phone),services(name,price)')
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
      .limit(30),
    supabase.from('orders')
      .select('*,order_items(product_name,quantity,price_at_purchase)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('saved_salons')
      .select('id,salon_id,salons(name,emoji,slug,area,city,rating,price_from,images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase.from('saved_products')
      .select('id,product_id,products(id,name,brand,price,images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Type-safe casts
  const profile       = profileRaw       as any
  const bookings      = bookingsRaw      as any[]  || []
  const orders        = ordersRaw        as any[]  || []
  const savedSalons   = savedSalonsRaw   as any[]  || []
  const savedProducts = savedProductsRaw as any[]  || []
  const notifications = notificationsRaw as any[]  || []

  // ── Derived ───────────────────────────────────────────────────────────────
  const today    = new Date().toISOString().split('T')[0]
  const upcoming = (bookings as any[])?.filter((b: any) =>
    ['pending','confirmed'].includes(b.status) && b.booking_date >= today
  ) || []
  const past = (bookings as any[])?.filter((b: any) =>
    !['pending','confirmed'].includes(b.status) || b.booking_date < today
  ) || []
  const unread   = (notifications as any[])?.filter((n: any) => !n.is_read).length || 0

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'bookings',  label: 'Bookings', badge: upcoming.length || undefined },
    { id: 'orders',    label: 'Orders' },
    { id: 'saved',     label: 'Saved' },
    { id: 'profile',   label: 'Profile' },
  ]

  return (
    <div className="container py-8 max-w-4xl">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose to-gold flex items-center justify-center text-white text-xl font-black flex-shrink-0">
          {profile?.first_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-black">Hi, {profile?.first_name}! 👋</h1>
          <p className="text-ink-3 text-sm">{user.email}</p>
        </div>
        {unread > 0 && (
          <span className="ml-auto badge-pill bg-rose text-white text-xs">
            🔔 {unread} new
          </span>
        )}
      </div>

      {/* Flash message */}
      {searchParams.msg === 'profile_saved' && (
        <div className="alert-success mb-4">✅ Profile updated successfully!</div>
      )}
      {searchParams.msg === 'password_changed' && (
        <div className="alert-success mb-4">✅ Password changed. You're now signed in.</div>
      )}
      {searchParams.msg === 'booking_cancelled' && (
        <div className="alert-success mb-4">Booking cancelled.</div>
      )}

      {/* Tabs */}
      <div className="tabs mb-6">
        {tabs.map(t => (
          <Link key={t.id} href={`/account?tab=${t.id}`}
            className={`tab flex items-center gap-1.5 ${tab === t.id ? 'active' : ''}`}>
            {t.label}
            {t.badge ? (
              <span className="bg-rose text-white text-2xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {t.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid-4">
            {[
              ['📅', 'Upcoming', upcoming.length],
              ['🏁', 'Completed', (bookings as any[])?.filter((b: any) => b.status === 'completed').length || 0],
              ['🛍️', 'Orders', orders?.length || 0],
              ['❤️', 'Saved Salons', savedSalons?.length || 0],
            ].map(([icon, label, val]) => (
              <div key={label as string} className="card card-body text-center py-4">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xl font-black">{val}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-ink-3">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Upcoming bookings */}
            <div className="card card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">Upcoming Bookings</h2>
                <Link href="/account?tab=bookings" className="text-xs text-rose font-bold">View all →</Link>
              </div>
              {!upcoming.length ? (
                <div className="text-center py-6 text-ink-3 text-sm">
                  <p className="text-3xl mb-2">📅</p>
                  <p>No upcoming bookings</p>
                  <Link href="/salons" className="btn btn-primary btn-sm mt-3">Find a Salon →</Link>
                </div>
              ) : upcoming.slice(0, 4).map((b: any) => (
                <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-bdr last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{(b.salons as any)?.emoji} {(b.salons as any)?.name}</p>
                    <p className="text-xs text-ink-3">{fmtDate(b.booking_date)} · {b.time_slot}</p>
                  </div>
                  <span className={`status status-${b.status} text-xs`}>{b.status}</span>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div className="card card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">Notifications</h2>
                {unread > 0 && <span className="text-xs text-rose font-bold">{unread} unread</span>}
              </div>
              {!notifications?.length ? (
                <div className="text-center py-6 text-ink-3 text-sm">
                  <p className="text-3xl mb-2">🔔</p>
                  <p>No notifications yet</p>
                </div>
              ) : notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className={`py-2.5 border-b border-bdr last:border-0 ${!n.is_read ? 'pl-2 border-l-2 border-l-rose' : ''}`}>
                  <p className={`text-xs ${!n.is_read ? 'font-bold' : 'font-medium'} text-ink`}>{n.title}</p>
                  {n.body && <p className="text-xs text-ink-3 truncate">{n.body}</p>}
                  <p className="text-2xs text-ink-3 mt-0.5">{new Date(n.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKINGS ─────────────────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="space-y-5">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map((b: any) => (
                  <div key={b.id} className="card card-body">
                    <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{(b.salons as any)?.emoji}</span>
                          <Link href={`/salon/${(b.salons as any)?.slug}`} className="font-bold hover:text-rose">
                            {(b.salons as any)?.name}
                          </Link>
                        </div>
                        <p className="text-sm text-ink-2">{(b.services as any)?.name || 'Appointment'}</p>
                        <p className="text-sm text-ink-3">📅 {fmtDate(b.booking_date)} at {b.time_slot}</p>
                        <p className="text-xs text-ink-3 mt-1">
                          Ref: <strong>{b.reference}</strong>
                          {' · '}
                          {b.deposit_paid
                            ? <span className="text-gn font-semibold">✓ Deposit {fmtPrice(b.deposit_amount)} paid</span>
                            : <span className="text-gold font-semibold">⏳ Deposit {fmtPrice(b.deposit_amount)} pending</span>
                          }
                        </p>
                        {(b.salons as any)?.phone && (
                          <a href={`tel:${(b.salons as any).phone}`} className="text-xs text-rose mt-1 block">
                            📞 {(b.salons as any).phone}
                          </a>
                        )}
                      </div>
                      <span className={`status status-${b.status}`}>{b.status.replace('_',' ')}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-3 border-t border-bdr">
                      {!b.deposit_paid && (
                        <Link href={`/api/pay-deposit?booking_id=${b.id}`} className="btn btn-primary btn-sm">
                          Pay Deposit {fmtPrice(b.deposit_amount)} →
                        </Link>
                      )}
                      <form action={async () => {
                        'use server'
                        await cancelBooking(b.id)
                        redirect('/account?tab=bookings&msg=booking_cancelled')
                      }}>
                        <button className="btn btn-outline btn-sm text-rose border-rose/50 hover:border-rose">
                          Cancel
                        </button>
                      </form>
                      <Link href={`/salon/${(b.salons as any)?.slug}`} className="btn btn-outline btn-sm">
                        View Salon →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3">Past Bookings</h2>
              <div className="space-y-3">
                {past.map((b: any) => (
                  <div key={b.id} className="card card-body opacity-80">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-semibold">{(b.salons as any)?.emoji} {(b.salons as any)?.name}</p>
                        <p className="text-sm text-ink-2">{(b.services as any)?.name || 'Appointment'}</p>
                        <p className="text-sm text-ink-3">{fmtDate(b.booking_date)} · {b.time_slot}</p>
                        <p className="text-xs text-ink-3 mt-1">Ref: {b.reference}</p>
                      </div>
                      <span className={`status status-${b.status}`}>{b.status.replace('_',' ')}</span>
                    </div>
                    {b.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-bdr">
                        <Link href={`/salon/${(b.salons as any)?.slug}#reviews`} className="text-xs text-rose font-bold hover:underline">
                          ⭐ Leave a review →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!bookings?.length && (
            <div className="text-center py-16 text-ink-3">
              <p className="text-5xl mb-3">📅</p>
              <p className="font-bold text-lg mb-2">No bookings yet</p>
              <p className="text-sm mb-4">Find a salon and book your first appointment</p>
              <Link href="/salons" className="btn btn-primary">Find a Salon →</Link>
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS ───────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {!orders?.length ? (
            <div className="text-center py-16 text-ink-3">
              <p className="text-5xl mb-3">🛍️</p>
              <p className="font-bold text-lg mb-2">No orders yet</p>
              <Link href="/shop" className="btn btn-primary">Browse the Shop →</Link>
            </div>
          ) : orders.map((o: any) => (
            <div key={o.id} className="card card-body">
              <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                <div>
                  <p className="font-bold">Order {o.reference}</p>
                  <p className="text-sm text-ink-3">
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                  <p className="text-xs text-ink-3 mt-1">
                    📍 {o.address}, {o.city}, {o.postcode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg">{fmtPrice(o.total)}</p>
                  <span className={`status status-${o.status}`}>{o.status}</span>
                </div>
              </div>

              {/* Order items */}
              <div className="bg-page-2 rounded-xl p-3 mb-3 space-y-1.5">
                {(o.order_items as any[])?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ink-2">{item.product_name} <span className="text-ink-3">×{item.quantity}</span></span>
                    <span className="font-semibold">{fmtPrice(item.price_at_purchase * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-ink-3 pt-1.5 border-t border-bdr">
                  <span>Delivery</span>
                  <span>{fmtPrice(o.delivery_cost)}</span>
                </div>
              </div>

              <Link href={`/order?ref=${o.reference}`} className="text-xs text-rose font-bold hover:underline">
                View full order details →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── SAVED ────────────────────────────────────────────────────────── */}
      {tab === 'saved' && (
        <div className="space-y-8">
          {/* Saved salons */}
          <div>
            <h2 className="font-bold text-lg mb-3">Saved Salons ({savedSalons?.length || 0})</h2>
            {!savedSalons?.length ? (
              <div className="text-center py-10 text-ink-3 bg-page-2 rounded-2xl">
                <p className="text-4xl mb-2">🏪</p>
                <p className="font-bold mb-1">No saved salons</p>
                <Link href="/salons" className="btn btn-primary btn-sm mt-3">Browse Salons →</Link>
              </div>
            ) : (
              <div className="grid-3">
                {savedSalons.map((s: any) => {
                  const salon = s.salons as any
                  const img   = salon?.images?.[0]
                  return (
                    <div key={s.id} className="card">
                      <Link href={`/salon/${salon?.slug}`}>
                        <div className="h-32 bg-gradient-to-br from-ink to-purple-900 relative overflow-hidden">
                          {img
                            ? <img src={img} alt={salon?.name} className="w-full h-full object-cover opacity-80"/>
                            : <div className="absolute inset-0 flex items-center justify-center text-4xl">{salon?.emoji}</div>
                          }
                        </div>
                      </Link>
                      <div className="p-3 flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <Link href={`/salon/${salon?.slug}`} className="font-bold text-sm truncate block hover:text-rose">{salon?.name}</Link>
                          <p className="text-xs text-ink-3">📍 {salon?.area}, {salon?.city}</p>
                          {salon?.rating > 0 && <p className="text-xs text-ink-3">★ {salon.rating}</p>}
                        </div>
                        <form action={async () => {
                          'use server'
                          const { createClient } = await import('@/lib/supabase/server')
                          const sb = await createClient()
                          await sb.from('saved_salons').delete().eq('id', s.id)
                          redirect('/account?tab=saved')
                        }}>
                          <button className="text-ink-3 hover:text-rose text-xs flex-shrink-0 mt-0.5" title="Unsave">❤️</button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Saved products */}
          <div>
            <h2 className="font-bold text-lg mb-3">Saved Products ({savedProducts?.length || 0})</h2>
            {!savedProducts?.length ? (
              <div className="text-center py-10 text-ink-3 bg-page-2 rounded-2xl">
                <p className="text-4xl mb-2">🛍️</p>
                <p className="font-bold mb-1">No saved products</p>
                <Link href="/shop" className="btn btn-primary btn-sm mt-3">Browse Shop →</Link>
              </div>
            ) : (
              <div className="grid-4">
                {savedProducts  .map((sp: any) => {
                  const p = sp.products as any
                  return (
                    <div key={sp.id} className="card">
                      <Link href={`/shop/${p?.id}`}>
                        <div className="h-28 bg-page-2 overflow-hidden">
                          {p?.images?.[0]
                            ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center text-4xl">🧴</div>
                          }
                        </div>
                      </Link>
                      <div className="p-3">
                        <p className="text-2xs text-ink-3 font-bold uppercase">{p?.brand}</p>
                        <Link href={`/shop/${p?.id}`} className="font-semibold text-xs line-clamp-2 hover:text-rose block">{p?.name}</Link>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="font-black text-sm">{p?.price ? fmtPrice(p.price) : ''}</span>
                          <form action={async () => {
                            'use server'
                            const { createClient } = await import('@/lib/supabase/server')
                            const sb = await createClient()
                            await sb.from('saved_products').delete().eq('id', sp.id)
                            redirect('/account?tab=saved')
                          }}>
                            <button className="text-ink-3 hover:text-rose text-xs" title="Unsave">❤️</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROFILE ──────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="grid-2 items-start">
          {/* Edit profile form */}
          <div className="card card-body">
            <h2 className="font-bold text-lg mb-5">Edit Profile</h2>
            <form action={updateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input name="first_name" className="input" defaultValue={profile?.first_name || ''} required maxLength={50}/>
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input name="last_name" className="input" defaultValue={profile?.last_name || ''} required maxLength={50}/>
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" type="tel" className="input" placeholder="+44 7700 900000" defaultValue={profile?.phone || ''}/>
              </div>
              <div>
                <label className="label">City</label>
                <select name="city" className="input">
                  <option value="">Select city…</option>
                  {['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other'].map(c => (
                    <option key={c} value={c} selected={profile?.city === c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hair Type <span className="font-normal text-ink-3">(helps us recommend salons)</span></label>
                <select name="hair_type" className="input">
                  <option value="">Select hair type…</option>
                  {[['4C','4C — Tight Coils'],['4B','4B — Z-Shape Coils'],['4A','4A — Loose Coils'],['3C','3C — Kinky Curls'],['3B','3B — Corkscrew'],['Wig/Weave','Wig / Weave'],['Mixed','Mixed Texture'],['Relaxed','Relaxed / Texturized'],['Other','Other']].map(([v,l]) => (
                    <option key={v} value={v} selected={profile?.hair_type === v}>{l}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center">
                Save Profile →
              </button>
            </form>
          </div>

          {/* Account info + security */}
          <div className="space-y-4">
            <div className="card card-body">
              <h2 className="font-bold text-lg mb-4">Account</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Email</label>
                  <p className="text-ink text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-ink-3 mt-0.5">Contact support to change your email</p>
                </div>
                <div>
                  <label className="label">Account Type</label>
                  <p className="text-ink text-sm font-medium capitalize">{profile?.account_type || 'Customer'}</p>
                </div>
                {profile?.account_type === 'owner' && (
                  <div>
                    <label className="label">Salon</label>
                    <Link href="/dashboard" className="text-rose text-sm font-bold hover:underline">Go to Salon Dashboard →</Link>
                  </div>
                )}
              </div>
            </div>

            <div className="card card-body">
              <h2 className="font-bold text-lg mb-4">Security</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-bdr">
                  <div>
                    <p className="font-semibold text-sm">Password</p>
                    <p className="text-xs text-ink-3">Last changed: unknown</p>
                  </div>
                  <Link href="/auth/reset-password" className="btn btn-outline btn-sm">Change →</Link>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-semibold text-sm">Sign Out</p>
                    <p className="text-xs text-ink-3">Sign out of this device</p>
                  </div>
                  <form action={async () => {
                    'use server'
                    const { createClient } = await import('@/lib/supabase/server')
                    const sb = await createClient()
                    await sb.auth.signOut()
                    redirect('/')
                  }}>
                    <button className="btn btn-outline btn-sm text-rose border-rose/50">Sign Out</button>
                  </form>
                </div>
              </div>
            </div>

            <div className="card card-body bg-page-2 border-0">
              <p className="text-xs text-ink-3 leading-relaxed">
                Need help? Email <a href="mailto:hello@glownaija.co.uk" className="text-rose font-bold">hello@glownaija.co.uk</a>
                <br/>To delete your account email <a href="mailto:privacy@glownaija.co.uk" className="text-rose font-bold">privacy@glownaija.co.uk</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
