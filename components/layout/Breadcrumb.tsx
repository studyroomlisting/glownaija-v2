import Link from 'next/link'

interface Crumb { label: string; href?: string }

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="bg-ink/95 py-2">
      <div className="container flex items-center gap-2 text-xs text-white/50">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {c.href ? <Link href={c.href} className="hover:text-white transition-colors">{c.label}</Link> : <span className="text-white">{c.label}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
