'use client'
import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import { toggleProductActive, deleteProduct } from '@/lib/actions/products'
import ActionButton from '@/components/dashboard/ActionButton'
import type { Product } from '@/types/database'

export default function ProductRow({ product }: { product: Product }) {
  return (
    <div className="card card-body flex justify-between items-center flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-page-2 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
          {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : '🧴'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm truncate">{product.name}</span>
            {!product.is_active && <span className="badge-pill bg-page-2 text-ink-3 text-2xs">Hidden</span>}
            {product.stock_count === 0 && <span className="badge-pill bg-rose-100 text-rose text-2xs">Out of stock</span>}
          </div>
          <p className="text-xs text-ink-3">{product.brand} · {product.category} · {fmtPrice(product.price)} · Stock: {product.stock_count}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        <Link href={`/admin?tab=products&edit=${product.id}`} className="btn btn-outline btn-sm text-xs">✏️ Edit</Link>
        <ActionButton action={toggleProductActive.bind(null, product.id, !product.is_active)} className={`btn btn-sm btn-outline text-xs ${product.is_active ? '' : 'text-gn border-gn'}`}>
          {product.is_active ? 'Hide' : 'Unhide'}
        </ActionButton>
        <ActionButton action={deleteProduct.bind(null, product.id)} className="btn btn-sm btn-outline text-xs text-rose border-rose"
          confirmMessage={`Remove "${product.name}" from the shop? (Stock will be zeroed and it will be hidden — past orders are kept.)`}>
          🗑 Remove
        </ActionButton>
      </div>
    </div>
  )
}
