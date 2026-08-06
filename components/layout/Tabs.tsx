'use client'
import { cn } from '@/lib/utils'

interface Tab { id: string; label: string; badge?: number }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 border-b border-bdr mb-5">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn('px-4 py-2.5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-1.5',
            active === tab.id ? 'text-white bg-ink' : 'text-ink-3 hover:text-ink')}>
          {tab.label}
          {tab.badge ? (
            <span className={cn('min-w-[18px] h-[18px] flex items-center justify-center text-2xs font-bold rounded-full px-1',
              active === tab.id ? 'bg-white/25 text-white' : 'bg-rose text-white')}>
              {tab.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
