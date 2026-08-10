import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import QuickAddButton from '@/components/shop/QuickAddButton'
import MiniAddButton from '@/components/home/MiniAddButton'

const BADGE_STYLES: Record<string, string> = {
  rose:  'bg-rose text-white',
  gold:  'bg-purple-600 text-white',
  green: 'bg-ink text-white',
}
const BADGE_LABELS: Record<string, string> = {
  rose: 'BEST SELLER', gold: 'TOP RATED', green: 'NEW ARRIVAL',
}

export default function HomeProductCard({ product }: { product: any }) {
  const img = product.images?.[0]
  return (
    <div className="card group">
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative h-44 bg-page-2 overflow-hidden">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            : <div className="absolute inset-0 flex items-center justify-center text-5xl">🧴</div>}
          {product.badge && (
            <span className={`absolute top-2 left-2 badge-pill text-2xs font-bold uppercase tracking-wide ${BADGE_STYLES[product.badge_type || 'rose']}`}>
              {BADGE_LABELS[product.badge_type || 'rose']}
            </span>
          )}
          <MiniAddButton product={product} className="absolute bottom-2 right-2"/>
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
