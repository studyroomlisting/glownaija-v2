import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import QuickAddButton from './QuickAddButton'
import type { Product } from '@/types/database'

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
  const badgeColors: Record<string, string> = { rose: 'bg-rose', gold: 'bg-gold', green: 'bg-gn' }
  return (
    <div className="card group relative">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative h-44 bg-page-2 overflow-hidden">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="absolute inset-0 flex items-center justify-center text-5xl">🧴</div>}
          {product.badge && (
            <span className={`absolute top-2 left-2 badge-pill text-white text-2xs uppercase tracking-wide ${badgeColors[product.badge_type || 'rose'] || 'bg-rose'}`}>
              {product.badge}
            </span>
          )}
        </div>
        <div className="p-4 pb-0">
          <p className="text-2xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">{product.brand}</p>
          <p className="font-bold text-sm text-ink mb-1.5 line-clamp-2 min-h-[2.5rem]">{product.name}</p>
          {product.rating > 0 && (
            <p className="text-xs text-ink-3">★ {product.rating} <span className="text-ink-3/70">({product.review_count})</span></p>
          )}
        </div>
      </Link>
      <div className="flex items-center justify-between p-4 pt-3">
        <span className="font-black text-base">{fmtPrice(product.price)}</span>
        <QuickAddButton product={{ id: product.id, name: product.name, brand: product.brand, price: product.price, images: product.images || [], stock_count: product.stock_count }} />
      </div>
    </div>
  )
}
