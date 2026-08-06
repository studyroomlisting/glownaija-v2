import Link from 'next/link'

export interface DashboardNavItem {
  id: string
  label: string
  icon: string
  badge?: number
}

interface DashboardSidebarProps {
  basePath: string          // e.g. '/dashboard', '/admin', '/account'
  activeTab: string
  items: DashboardNavItem[]
  brandInitial: string
  brandName: string
  brandSubtitle: string
  userName: string
  userRole: string
  userAvatarUrl?: string | null
  extraQuery?: string       // e.g. 'salon=<id>' — preserved on every nav link
  accountHref?: string      // where the user block at the bottom links to
}

export default function DashboardSidebar({
  basePath, activeTab, items, brandInitial, brandName, brandSubtitle,
  userName, userRole, userAvatarUrl, extraQuery, accountHref,
}: DashboardSidebarProps) {
  const qs = (tabId: string) => `${basePath}?${extraQuery ? extraQuery + '&' : ''}tab=${tabId}`

  const UserBlock = (
    <Link href={accountHref || '#'} className="flex items-center gap-2.5 px-1 py-1 -mx-1 rounded-xl hover:bg-page-2 transition-colors">
      {userAvatarUrl
        ? <img src={userAvatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt=""/>
        : <div className="w-8 h-8 rounded-full bg-rose flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userName?.[0]?.toUpperCase() || '?'}</div>
      }
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate">{userName}</p>
        <p className="text-2xs text-ink-3">{userRole}</p>
      </div>
      <span className="text-ink-3 text-xs flex-shrink-0">✎</span>
    </Link>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-bdr bg-white">
        <div className="p-5 flex items-center gap-3 border-b border-bdr">
          <div className="w-9 h-9 rounded-xl bg-rose flex items-center justify-center text-white font-black flex-shrink-0">{brandInitial}</div>
          <div className="min-w-0">
            <p className="font-black text-sm leading-tight truncate">{brandName}</p>
            <p className="text-2xs text-ink-3 truncate">{brandSubtitle}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const active = activeTab === item.id
            return (
              <Link key={item.id} href={qs(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-rose text-white' : 'text-ink-2 hover:bg-page-2'}`}>
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className={`text-2xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 ${active ? 'bg-white/25 text-white' : 'bg-rose text-white'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-bdr">{UserBlock}</div>
      </aside>

      {/* Mobile: horizontal scrollable pill bar — keeps the same nav items/links,
          just laid out for small screens instead of a sidebar */}
      <div className="lg:hidden border-b border-bdr bg-white">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-bdr">
          <div className="w-7 h-7 rounded-lg bg-rose flex items-center justify-center text-white text-xs font-black flex-shrink-0">{brandInitial}</div>
          <p className="font-black text-sm truncate">{brandName}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
          {items.map(item => {
            const active = activeTab === item.id
            return (
              <Link key={item.id} href={qs(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${active ? 'bg-rose text-white' : 'bg-page-2 text-ink-2'}`}>
                <span>{item.icon}</span>{item.label}
                {item.badge ? <span className="text-2xs">({item.badge})</span> : null}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
