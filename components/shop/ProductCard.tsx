import Link from 'next/link'
import Image from 'next/image'
import { fmtPrice } from '@/lib/utils'
import type { Product } from '@/types/database'

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
  const badgeColors: Record<string, string> = { rose: 'bg-rose', gold: 'bg-gold', green: 'bg-gn' }
  return (
    <Link href={`/shop/${product.id}`} className="card block">
      <div className="relative h-44 bg-page-2 overflow-hidden">
        {img ? <Image src={img} alt={product.name} fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl">🧴</div>}
        {product.badge && <span className={`absolute top-2 left-2 badge-pill text-white text-2xs ${badgeColors[product.badge_type||'rose'] || 'bg-rose'}`}>{product.badge}</span>}
      </div>
      <div className="p-4">
        <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">{product.brand}</p>
        <p className="font-bold text-sm text-ink mb-1.5 line-clamp-2">{product.name}</p>
        <div className="flex items-center justify-between">
          <span className="font-black text-base">{fmtPrice(product.price)}</span>
          {product.original_price && <span className="text-xs text-ink-3 line-through">{fmtPrice(product.original_price)}</span>}
        </div>
        {product.rating > 0 && <p className="text-xs text-ink-3 mt-1">★ {product.rating} ({product.review_count})</p>}
      </div>
    </Link>
  )
}
