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

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const tab = searchParams.tab || 'overview'

  const [
    { count: salons_count },
    { count: users_count },
    { count: bookings_count },
    { count: orders_count },
  ] = await Promise.all([
    supabase.from('salons').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('booking_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ])

  const { data: salons }   = await supabase.from('salons').select('*').order('created_at', { ascending: false }).limit(30)
  const { data: users }    = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(30)
  const { data: bookings } = await supabase.from('bookings').select('*,salons(name),profiles(first_name,last_name,email)').order('created_at', { ascending: false }).limit(30)
  const { data: orders }   = await supabase.from('orders').select('*,profiles(first_name,last_name,email)').order('created_at', { ascending: false }).limit(30)
  const { data: reviews }  = await supabase.from('reviews').select('*,profiles(first_name,last_name),salons(name)').order('created_at', { ascending: false }).limit(30)
  const { data: audit }    = await supabase.from('audit_logs').select('*,profiles(first_name,last_name)').order('created_at', { ascending: false }).limit(50)

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

  const tabs = ['overview', 'salons', 'users', 'bookings', 'orders', 'reviews', 'audit']
    .map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))

  return (
    <div>
      <div className="bg-ink py-5">
        <div className="container flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-white text-xl font-black">⚙️ Admin Panel</h1>
          <Link href="/" className="btn btn-outline btn-sm border-white/30 text-white text-xs">View Site</Link>
        </div>
      </div>
      <div className="container py-6">
        <div className="tabs mb-6">
          {tabs.map(t => <Link key={t.id} href={`/admin?tab=${t.id}`} className={`tab ${tab === t.id ? 'active' : ''}`}>{t.label}</Link>)}
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid-4">
              <div className="card card-body text-center"><div className="text-3xl mb-1">🏪</div><div className="text-2xl font-black">{salons_count || 0}</div><div className="text-xs font-bold uppercase text-ink-3">Active Salons</div></div>
              <div className="card card-body text-center"><div className="text-3xl mb-1">👥</div><div className="text-2xl font-black">{users_count || 0}</div><div className="text-xs font-bold uppercase text-ink-3">Users</div></div>
              <div className="card card-body text-center"><div className="text-3xl mb-1">📅</div><div className="text-2xl font-black">{bookings_count || 0}</div><div className="text-xs font-bold uppercase text-ink-3">Bookings (30d)</div></div>
              <div className="card card-body text-center"><div className="text-3xl mb-1">🛍️</div><div className="text-2xl font-black">{orders_count || 0}</div><div className="text-xs font-bold uppercase text-ink-3">Orders (30d)</div></div>
            </div>
            <div className="card card-body">
              <h2 className="font-bold mb-3">Quick Links</h2>
              <div className="flex gap-2 flex-wrap">
                <Link href="/admin?tab=salons" className="btn btn-outline btn-sm text-xs">🏪 Manage Salons</Link>
                <Link href="/admin?tab=users" className="btn btn-outline btn-sm text-xs">👥 Manage Users</Link>
                <Link href="/admin?tab=reviews" className="btn btn-outline btn-sm text-xs">⭐ Moderate Reviews</Link>
                <Link href="/admin?tab=orders" className="btn btn-outline btn-sm text-xs">🛍️ Manage Orders</Link>
                <Link href="/admin?tab=audit" className="btn btn-outline btn-sm text-xs">📜 Audit Log</Link>
              </div>
            </div>
          </div>
        )}

        {tab === 'salons' && (
          <div className="space-y-3">
            {!salons?.length
              ? <div className="text-center py-12 text-ink-3">No salons yet</div>
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
  )
}
