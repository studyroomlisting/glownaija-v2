'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/types/database'
import CartSidebar from '@/components/shop/CartSidebar'

const NAV_LINKS: [string, string][] = [['/salons', 'Salons'], ['/shop', 'Shop'], ['/events', 'Events'], ['/about', 'About']]
const GLOW_AI_LINKS: [string, string, string][] = [
  ['/chat', '💬', 'Chat with Glow AI'],
  ['/stylist', '✨', 'AI Stylist Quiz'],
]

export default function Header() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifs, setNotifs]   = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)
  const [notifList, setNotifList]   = useState<any[]>([])
  const [glowMenuOpen, setGlowMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [ownsASalon, setOwnsASalon] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()
  const glowMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') { setNotifOpen(false); setMobileOpen(false); setGlowMenuOpen(false); setAccountMenuOpen(false) }
    }
    function handleClickOutside(e: MouseEvent) {
      if (glowMenuRef.current && !glowMenuRef.current.contains(e.target as Node)) setGlowMenuOpen(false)
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) setAccountMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
        supabase.from('salons').select('id').eq('owner_id', user.id).limit(1)
          .then(({ data }) => setOwnsASalon(!!data?.length))
        fetchNotifs()
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchNotifs() {
    const res = await fetch('/api/notifications?limit=10')
    const data = await res.json()
    setNotifs(data.unread_count || 0)
    setNotifList(data.data || [])
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mark_all_read: true }) })
    setNotifs(0)
    setNotifList(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const isOwner = profile?.account_type === 'owner' || ownsASalon
  const displayName = profile?.first_name
    || user?.user_metadata?.given_name
    || user?.user_metadata?.full_name?.split(' ')?.[0]
    || user?.user_metadata?.name?.split(' ')?.[0]
    || null
  const avatarInitial = displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header className="bg-white border-b border-bdr sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3 gap-4">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 leading-none">
          <div className="text-xl font-black tracking-tight">
            <span className="text-rose">Glow</span>
            <span className="text-ink">Naija</span>
          </div>
          <div className="text-[10px] font-semibold tracking-wide text-ink-3 hidden sm:block">Beauty. Style. You.</div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-ink-3" aria-label="Main navigation">
          {NAV_LINKS.map(([href, label]) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`)
            return (
              <Link key={href} href={href}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-full transition-colors ${active ? 'bg-rose text-white' : 'hover:bg-page-2 hover:text-rose'}`}>
                {label}
              </Link>
            )
          })}

          {/* Glow AI dropdown */}
          <div className="relative" ref={glowMenuRef}>
            <button
              onClick={() => setGlowMenuOpen(v => !v)}
              aria-haspopup="true" aria-expanded={glowMenuOpen}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${glowMenuOpen || pathname === '/chat' || pathname === '/stylist' ? 'bg-rose text-white' : 'hover:bg-page-2 hover:text-rose'}`}>
              ✦ Glow AI
              <span className={`text-xs transition-transform ${glowMenuOpen ? 'rotate-45' : ''}`}>＋</span>
            </button>
            {glowMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-9 w-56 bg-white rounded-2xl shadow-xl border border-bdr overflow-hidden z-50">
                {GLOW_AI_LINKS.map(([href, icon, label]) => (
                  <Link key={href} href={href} onClick={() => setGlowMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink hover:bg-page-2 transition-colors">
                    <span>{icon}</span>{label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <Link href="/search" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors" aria-label="Search">🔍</Link>

          <CartSidebar/>

          <Link href="/wishlist" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors" aria-label="Wishlist">🤍</Link>

          {user && (
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead() }}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors"
                aria-label="Notifications" aria-haspopup="true" aria-expanded={notifOpen}>
                🔔
                {notifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-2xs font-bold text-white bg-rose rounded-full px-1">
                    {notifs > 9 ? '9+' : notifs}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-bdr overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-bdr font-bold text-sm">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifList.length === 0
                      ? <div className="text-center py-8 text-ink-3 text-sm">No notifications yet</div>
                      : notifList.map(n => (
                        <Link key={n.id} href={n.link || '#'}
                          className={`flex gap-3 px-4 py-3 border-b border-bdr hover:bg-page-2 transition-colors ${!n.is_read ? 'bg-rose-50' : ''}`}
                          onClick={() => setNotifOpen(false)}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.is_read ? 'font-bold' : 'font-medium'} text-ink`}>{n.title}</p>
                            {n.body && <p className="text-xs text-ink-3 truncate mt-0.5">{n.body}</p>}
                          </div>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-rose flex-shrink-0 mt-1" />}
                        </Link>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <Link href="/dashboard" className="hidden md:flex btn btn-outline btn-sm ml-1">Dashboard</Link>
          )}
          {profile?.is_admin && (
            <Link href="/admin" className="hidden md:flex btn btn-sm bg-ink text-white">Admin</Link>
          )}

          {user ? (
            <div className="relative hidden md:block" ref={accountMenuRef}>
              <button onClick={() => setAccountMenuOpen(v => !v)} aria-label="Account menu" aria-haspopup="true" aria-expanded={accountMenuOpen}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-page-2 transition-colors overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full rounded-full bg-rose flex items-center justify-center text-white text-xs font-bold">{avatarInitial}</div>
                }
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-bdr overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-bdr">
                    <p className="text-sm font-bold text-ink truncate">{displayName || 'My Account'}</p>
                    <p className="text-xs text-ink-3 truncate">{profile?.email || user?.email}</p>
                  </div>
                  <Link href="/account" onClick={() => setAccountMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-semibold text-ink hover:bg-page-2 transition-colors">My Account</Link>
                  <form action={signOut}>
                    <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose hover:bg-page-2 transition-colors">Sign out</button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/signin" aria-label="Sign in" className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors">👤</Link>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-page-2 text-ink-3 text-xl"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-nav">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-bdr bg-white px-4 py-4 flex flex-col gap-1">
          {[['/', 'Home'], ['/salons', 'Salons'], ['/shop', 'Shop'], ['/events', 'Events'], ['/about', 'About'], ['/chat', '💬 Chat with Glow AI'], ['/stylist', '✨ AI Stylist Quiz'], ['/wishlist', 'Wishlist']].map(([href, label]) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-semibold py-2.5 px-3 -mx-3 rounded-xl border-b border-bdr ${active ? 'bg-rose text-white border-transparent' : 'text-ink-2'}`}
                onClick={() => setMobileOpen(false)}>{label}</Link>
            )
          })}

          {isOwner  && <Link href="/dashboard" className="btn btn-outline btn-sm justify-center mt-3" onClick={() => setMobileOpen(false)}>Dashboard</Link>}

          {user ? (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-bdr">
              <Link href="/account" className="text-sm font-semibold text-ink" onClick={() => setMobileOpen(false)}>My Account</Link>
              <form action={signOut}><button className="text-sm font-semibold text-rose">Sign out</button></form>
            </div>
          ) : (
            <div className="flex gap-3 mt-3">
              <Link href="/auth/signin" className="btn btn-outline btn-sm flex-1 justify-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm flex-1 justify-center" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
