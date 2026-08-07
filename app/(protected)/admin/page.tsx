// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SalonRow  from '@/components/admin/SalonRow'
import UserRow   from '@/components/admin/UserRow'
import ReviewRow from '@/components/admin/ReviewRow'
import OrderRow  from '@/components/admin/OrderRow'
import AuditRow  from '@/components/admin/AuditRow'
import ProductForm from '@/components/admin/ProductForm'
import ProductRow  from '@/components/admin/ProductRow'
import StatsCard from '@/components/dashboard/StatsCard'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { expireStaleBookings } from '@/lib/bookings-expiry'
import { fmtPrice } from '@/lib/utils'

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string; status?: string; edit?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('is_admin,first_name,last_name,avatar_url').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const tab = searchParams.tab || 'overview'

  await expireStaleBookings(supabase)

  const [
    { count: salons_count },
    { count: customers_count },
    { count: owners_count },
    { count: bookings_count },
    { count: orders_count },
    { count: pending_count },
    { count: products_count },
    { data: recentBookings },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('salons').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'customer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'owner'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('booking_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from('salons').select('*', { count: 'exact', head: true }).eq('listing_status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    // Revenue is deposits actually collected on bookings (deposit_paid=true), not the
    // full booking value (the remainder is paid in-person, outside the platform).
    supabase.from('bookings').select('deposit_amount').eq('deposit_paid', true).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    // Orders count toward revenue once actually paid — 'pending'/'cancelled'/'refunded' don't.
    supabase.from('orders').select('total').in('status', ['paid', 'shipped', 'delivered']).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ])
  const users_count = (customers_count || 0) + (owners_count || 0)
  const revenue30d = (recentBookings || []).reduce((s, b) => s + (b.deposit_amount || 0), 0)
                    + (recentOrders   || []).reduce((s, o) => s + (o.total || 0), 0)

  let salonsQuery = supabase.from('salons').select('*').order('created_at', { ascending: false }).limit(30)
  if (searchParams.status) salonsQuery = salonsQuery.eq('listing_status', searchParams.status)
  const { data: salons }   = await salonsQuery
  const { data: users }    = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(30)
  const { data: bookings } = await supabase.from('bookings').select('*,salons(name),profiles(first_name,last_name,email)').order('created_at', { ascending: false }).limit(30)
  const { data: orders }   = await supabase.from('orders').select('*,profiles(first_name,last_name,email)').order('created_at', { ascending: false }).limit(30)
  const { data: reviews }  = await supabase.from('reviews').select('*,profiles(first_name,last_name),salons(name)').order('created_at', { ascending: false }).limit(30)
  const { data: audit }    = await supabase.from('audit_logs').select('*,profiles(first_name,last_name)').order('created_at', { ascending: false }).limit(50)
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50)
  const { data: editingProduct } = searchParams.edit
    ? await supabase.from('products').select('*').eq('id', searchParams.edit).single()
    : { data: null }

  // Ban status lives on auth.users (not the profiles table), so pull it separately
  // via the admin client and merge it into the user rows.
  let bannedIds = new Set<string>()
  try {
    const adminClient = await createAdminClient()
    const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 200 })
    bannedIds = new Set(
      (authList?.users || [])
        .filter(u => u.banned_until && new Date(u.banned_until) > new Date())
        .map(u => u.id)
    )
  } catch { /* non-fatal — user rows just show as not-banned if this lookup fails */ }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'salons',   label: 'Salons',   icon: '🏪', badge: pending_count || undefined },
    { id: 'users',    label: 'Users',    icon: '👥', badge: users_count || undefined },
    { id: 'products', label: 'Products', icon: '🧴', badge: products_count || undefined },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'orders',   label: 'Orders',   icon: '🛍️' },
    { id: 'reviews',  label: 'Reviews',  icon: '⭐' },
    { id: 'audit',    label: 'Audit Log',icon: '📜' },
  ]

  return (
    <div className="flex">
      <DashboardSidebar
        basePath="/admin"
        activeTab={tab}
        items={sidebarItems}
        brandInitial="⚙️"
        brandName="Admin Panel"
        brandSubtitle="GlowNaija"
        userName={profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Admin'}
        userRole="Administrator"
        userAvatarUrl={profile?.avatar_url}
        accountHref="/account"
      />

      <div className="flex-1 min-w-0">
        <div className="border-b border-bdr bg-white px-6 py-5 flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="text-ink-3 text-2xs uppercase tracking-widest mb-0.5">GlowNaija</p>
            <h1 className="text-xl font-black">Admin Overview</h1>
          </div>
          <Link href="/" className="btn btn-outline btn-sm text-xs">View Site</Link>
        </div>

        <div className="p-6">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid-4">
              <StatsCard icon="💰" label="Revenue (30d)" value={fmtPrice(revenue30d)}/>
              <StatsCard icon="🏪" label="Active Salons" value={salons_count || 0}/>
              <StatsCard icon="📅" label="Bookings (30d)" value={bookings_count || 0}/>
              <StatsCard icon="🛍️" label="Orders (30d)" value={orders_count || 0}/>
            </div>
            <div className="grid-4">
              <StatsCard icon="🙋" label="Customers" value={customers_count || 0}/>
              <StatsCard icon="💇" label="Salon Owners" value={owners_count || 0}/>
              <StatsCard icon="⏳" label="Pending Approvals" value={pending_count || 0}/>
              <StatsCard icon="🧴" label="Products" value={products_count || 0}/>
            </div>
            <div className="card card-body">
              <h2 className="font-bold mb-3">Quick Links</h2>
              <div className="flex gap-2 flex-wrap">
                <Link href="/admin?tab=salons" className="btn btn-outline btn-sm text-xs">🏪 Manage Salons</Link>
                <Link href="/admin?tab=users" className="btn btn-outline btn-sm text-xs">👥 Manage Users</Link>
                <Link href="/admin?tab=products" className="btn btn-outline btn-sm text-xs">🧴 Manage Products</Link>
                <Link href="/admin?tab=reviews" className="btn btn-outline btn-sm text-xs">⭐ Moderate Reviews</Link>
                <Link href="/admin?tab=orders" className="btn btn-outline btn-sm text-xs">🛍️ Manage Orders</Link>
                <Link href="/admin?tab=audit" className="btn btn-outline btn-sm text-xs">📜 Audit Log</Link>
              </div>
            </div>
          </div>
        )}

        {tab === 'salons' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap mb-2">
              {[['', 'All'], ['pending', `⏳ Pending${pending_count ? ` (${pending_count})` : ''}`], ['approved', '✓ Approved'], ['suspended', 'Suspended']].map(([val, label]) => (
                <Link key={val} href={`/admin?tab=salons${val ? `&status=${val}` : ''}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${(searchParams.status || '') === val ? 'bg-ink text-white' : 'bg-page-2 text-ink-3 hover:bg-page'}`}>
                  {label}
                </Link>
              ))}
            </div>
            {!salons?.length
              ? <div className="text-center py-12 text-ink-3">No salons found</div>
              : salons.map(s => <SalonRow key={s.id} salon={s} />)}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            {!users?.length
              ? <div className="text-center py-12 text-ink-3">No users yet</div>
              : users.map(u => <UserRow key={u.id} profile={{ ...u, banned: bannedIds.has(u.id) }} isSelf={u.id === user.id} />)}
          </div>
        )}

        {tab === 'products' && (
          <div className="grid-2 items-start">
            <div className="card card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">{editingProduct ? `Edit "${editingProduct.name}"` : 'Add New Product'}</h2>
                {editingProduct && <Link href="/admin?tab=products" className="text-xs text-rose font-bold">+ Add new instead</Link>}
              </div>
              <ProductForm key={editingProduct?.id || 'new'} product={editingProduct} />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-3">All Products ({products?.length || 0})</h2>
              {!products?.length ? (
                <div className="text-center py-12 text-ink-3">No products yet — add your first one.</div>
              ) : (
                <div className="space-y-3">
                  {products.map(p => <ProductRow key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="space-y-3">
            {!bookings?.length
              ? <div className="text-center py-12 text-ink-3">No bookings yet</div>
              : bookings.map(b => (
                <div key={b.id} className="card card-body">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-sm">{b.reference} <span className={`status status-${b.status} ml-2`}>{b.status}</span></p>
                      <p className="text-xs text-ink-3">{(b.salons as any)?.name} · {(b.profiles as any)?.first_name} {(b.profiles as any)?.last_name} · {b.booking_date} {b.time_slot}</p>
                    </div>
                    <p className="font-bold text-sm">{b.deposit_paid ? `£${(b.deposit_amount / 100).toFixed(2)}` : 'Unpaid'}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-3">
            {!orders?.length
              ? <div className="text-center py-12 text-ink-3">No orders yet</div>
              : orders.map(o => <OrderRow key={o.id} order={o} />)}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {!reviews?.length
              ? <div className="text-center py-12 text-ink-3">No reviews yet</div>
              : reviews.map(r => <ReviewRow key={r.id} review={r} />)}
          </div>
        )}

        {tab === 'audit' && (
          <div className="card card-body">
            <h2 className="font-bold mb-4">Last 50 Admin Actions</h2>
            <div className="space-y-2">
              {!audit?.length
                ? <div className="text-center py-8 text-ink-3">No admin actions recorded yet</div>
                : audit.map(a => <AuditRow key={a.id} log={a} />)}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
