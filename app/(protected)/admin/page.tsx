// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: profileRaw } = await supabase.from('profiles').select('is_admin').eq('id',user.id).single()
  if (!(profile as any)?.is_admin) redirect('/')
  const tab = searchParams.tab || 'overview'
  const [
    {count:salons_count},{count:users_count},{count:bookings_count},{count:orders_count}
  ] = await Promise.all([
    supabase.from('salons').select('*',{count:'exact',head:true}).eq('is_active',true),
    supabase.from('profiles').select('*',{count:'exact',head:true}),
    supabase.from('bookings').select('*',{count:'exact',head:true}).gte('booking_date',new Date(Date.now()-30*86400000).toISOString().split('T')[0]),
    supabase.from('orders').select('*',{count:'exact',head:true}).gte('created_at',new Date(Date.now()-30*86400000).toISOString()),
  ])
  const { data: salons   } = await supabase.from('salons').select('*').eq('is_active',true).order('created_at',{ascending:false}).limit(30)
  const { data: users    } = await supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(30)
  const { data: bookingsRaw } = await supabase.from('bookings').select('*,salons(name),profiles(first_name,last_name,email)').order('created_at',{ascending:false}).limit(30)
  const { data: orders   } = await supabase.from('orders').select('*,profiles(first_name,last_name,email)').order('created_at',{ascending:false}).limit(30)
  const { data: reviews  } = await supabase.from('reviews').select('*,profiles(first_name,last_name),salons(name)').order('created_at',{ascending:false}).limit(30)
  const { data: audit    } = await supabase.from('audit_logs').select('*,profiles(first_name,last_name)').order('created_at',{ascending:false}).limit(50)
  const tabs = ['overview','salons','users','bookings','orders','reviews','audit'].map(t=>({id:t,label:t.charAt(0).toUpperCase()+t.slice(1)}))
  return (
    <div>
      <div className="bg-ink py-5"><div className="container flex justify-between items-center flex-wrap gap-3"><h1 className="text-white text-xl font-black">⚙️ Admin Panel</h1><Link href="/" className="btn btn-outline btn-sm border-white/30 text-white text-xs">View Site</Link></div></div>
      <div className="container py-6">
        <div className="tabs mb-6">{tabs.map(t=><Link key={t.id} href={`/admin?tab=${t.id}`} className={`tab ${tab===t.id?'active':''}`}>{t.label}</Link>)}</div>

        {tab==='overview' && <div className="space-y-5"><div className="grid-4"><div className="card card-body text-center"><div className="text-3xl mb-1">🏪</div><div className="text-2xl font-black">{salons_count||0}</div><div className="text-xs font-bold uppercase text-ink-3">Active Salons</div></div><div className="card card-body text-center"><div className="text-3xl mb-1">👥</div><div className="text-2xl font-black">{users_count||0}</div><div className="text-xs font-bold uppercase text-ink-3">Users</div></div><div className="card card-body text-center"><div className="text-3xl mb-1">📅</div><div className="text-2xl font-black">{bookings_count||0}</div><div className="text-xs font-bold uppercase text-ink-3">Bookings (30d)</div></div><div className="card card-body text-center"><div className="text-3xl mb-1">🛍️</div><div className="text-2xl font-black">{orders_count||0}</div><div className="text-xs font-bold uppercase text-ink-3">Orders (30d)</div></div></div></div>}

        {tab==='salons' && <div className="space-y-3">{salons?.map(s=><div key={s.id} className="card card-body flex justify-between items-center flex-wrap gap-3"><div><p className="font-bold">{s.name} {s.is_featured&&'★'}</p><p className="text-xs text-ink-3">📍 {s.area}, {s.city} · ★{s.rating} · {s.review_count} reviews</p></div><div className="flex gap-2"><Link href={`/salon/${s.slug}`} className="btn btn-outline btn-sm text-xs">View</Link><form action={async () => { 'use server'; const { updateSalonStatus } = await import('@/lib/actions/admin'); await updateSalonStatus(s.id, s.listing_status==='approved'?'suspended':'approved') }}><button className={`btn btn-sm text-xs ${s.listing_status==='approved'?'btn-outline text-rose border-rose':'btn-green'}`}>{s.listing_status==='approved'?'Suspend':'Restore'}</button></form></div></div>)}</div>}

        {tab==='users' && <div className="space-y-3">{users?.map(u=><div key={u.id} className="card card-body flex justify-between items-center flex-wrap gap-3"><div><p className="font-bold text-sm">{u.first_name} {u.last_name}{u.is_admin&&' 🛡️'}</p><p className="text-xs text-ink-3">{u.email}</p></div></div>)}</div>}

        {tab==='bookings' && <div className="space-y-3">{bookings?.map(b=><div key={b.id} className="card card-body"><div className="flex justify-between items-start flex-wrap gap-2"><div><p className="font-bold text-sm">{b.reference} <span className={`status status-${b.status} ml-2`}>{b.status}</span></p><p className="text-xs text-ink-3">{(b.salons as any)?.name} · {(b.profiles as any)?.first_name} {(b.profiles as any)?.last_name} · {b.booking_date} {b.time_slot}</p></div><p className="font-bold text-sm">{b.deposit_paid?fmtPrice(b.deposit_amount):'Unpaid'}</p></div></div>)}</div>}

        {tab==='orders' && <div className="space-y-3">{orders?.map(o=><div key={o.id} className="card card-body flex justify-between items-center flex-wrap gap-2"><div><p className="font-bold text-sm">{o.reference}</p><p className="text-xs text-ink-3">{(o.profiles as any)?.first_name} {(o.profiles as any)?.last_name} · {new Date(o.created_at).toLocaleDateString('en-GB')}</p></div><div className="text-right"><p className="font-black">{fmtPrice(o.total)}</p><span className={`status status-${o.status}`}>{o.status}</span></div></div>)}</div>}

        {tab==='reviews' && <div className="space-y-3">{reviews?.map(r=><div key={r.id} className="card card-body"><div className="flex justify-between items-start mb-2"><div><p className="font-bold text-sm">{(r.profiles as any)?.first_name} on {(r.salons as any)?.name}</p><p className="text-xs text-ink-3">{new Date(r.created_at).toLocaleDateString('en-GB')}</p></div><div className="text-gold">{'★'.repeat(r.rating)}</div></div><p className="text-sm text-ink-2">{r.review_text}</p></div>)}</div>}

        {tab==='audit' && <div className="card card-body"><h2 className="font-bold mb-4">Last 50 Admin Actions</h2><div className="space-y-2">{audit?.map(a=><div key={a.id} className="flex gap-4 py-2 border-b border-bdr last:border-0 text-xs"><span className="text-ink-3 w-28 flex-shrink-0">{new Date(a.created_at).toLocaleDateString('en-GB')}</span><span className="font-bold w-40 flex-shrink-0">{a.action.replace(/_/g,' ')}</span><span className="text-ink-3">{a.entity_type} · {(a.profiles as any)?.first_name}</span></div>)}</div></div>}
      </div>
    </div>
  )
}