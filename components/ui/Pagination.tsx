import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  /** Given a target page number, returns the full href (query string included). */
  buildUrl: (page: number) => string
}

/** Numbered pagination with a small sliding window + Prev/Next, matching the
 *  style already used on /salons. Renders nothing when there's only one page. */
export default function Pagination({ page, totalPages, buildUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pageWindow = 2
  const pageNumbers: number[] = []
  for (let p = Math.max(1, page - pageWindow); p <= Math.min(totalPages, page + pageWindow); p++) pageNumbers.push(p)

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {page > 1 && (
        <Link href={buildUrl(page - 1)} className="btn btn-outline btn-sm">← Prev</Link>
      )}
      {pageNumbers[0] > 1 && <span className="text-ink-3 text-sm px-1">…</span>}
      {pageNumbers.map(p => (
        <Link key={p} href={buildUrl(p)} className={`btn btn-sm ${page === p ? 'bg-ink text-white' : 'btn-outline'}`}>
          {p}
        </Link>
      ))}
      {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="text-ink-3 text-sm px-1">…</span>}
      {page < totalPages && (
        <Link href={buildUrl(page + 1)} className="btn btn-outline btn-sm">Next →</Link>
      )}
    </div>
  )
}
