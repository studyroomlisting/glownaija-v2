'use client'
import { useState } from 'react'

export default function HomeCarousel({
  items, perPage, gridClass, renderItem,
}: {
  items: any[]
  perPage: number
  gridClass: string
  renderItem: (item: any) => React.ReactNode
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(items.length / perPage)
  const visible = items.slice(page * perPage, page * perPage + perPage)

  return (
    <div>
      <div className={gridClass}>
        {visible.map(item => renderItem(item))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-7">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} type="button" onClick={() => setPage(i)} aria-label={`Page ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === page ? 'w-5 bg-rose' : 'w-1.5 bg-bdr hover:bg-ink-3'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
