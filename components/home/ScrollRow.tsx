'use client'
import { useRef } from 'react'

export default function ScrollRow({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 hide-scrollbar pb-2"
      >
        {children}
      </div>

      {/* Desktop-only nav arrows */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="hidden lg:flex absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-bdr items-center justify-center text-ink-3 hover:text-rose hover:border-rose transition-colors z-10"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="hidden lg:flex absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose shadow-lg items-center justify-center text-white hover:bg-rose-dark transition-colors z-10"
      >
        →
      </button>
    </div>
  )
}
