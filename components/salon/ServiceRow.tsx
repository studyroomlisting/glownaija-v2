import Link from 'next/link'
import { fmtPrice, formatDuration } from '@/lib/utils'
import type { Service } from '@/types/database'

interface ServiceRowProps { service: Service; salonId: string; showBook?: boolean }

export default function ServiceRow({ service, salonId, showBook = true }: ServiceRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-bdr last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl w-8 text-center flex-shrink-0">{service.emoji}</span>
        <div>
          <p className="font-semibold text-sm text-ink">{service.name}</p>
          {service.description && <p className="text-xs text-ink-3">{service.description}</p>}
          <p className="text-xs text-ink-3 mt-0.5">⏱ {formatDuration(service.duration_minutes)}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-black text-lg">{fmtPrice(service.price)}</p>
        {showBook && (
          <Link href={`/booking?salon=${salonId}&service=${service.id}`}
            className="text-xs font-bold text-rose hover:underline">Book →</Link>
        )}
      </div>
    </div>
  )
}
