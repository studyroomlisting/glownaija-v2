'use client'
import { useState } from 'react'

export default function AccordionItem({
  title, children, defaultOpen = false, icon,
}: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-bdr last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <span className="font-bold text-sm sm:text-base">{title}</span>
        </div>
        <span className={`text-rose flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div className="pb-4 text-sm text-ink-2 leading-relaxed">{children}</div>}
    </div>
  )
}
