'use client'
import Image from 'next/image'
import Link from 'next/link'
import { fmtPrice } from '@/lib/utils'
import { useCart, CartItem as CartItemType } from '@/hooks/useCart'

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQty, removeItem } = useCart()
  return (
    <div className="flex gap-4 py-4 border-b border-bdr last:border-0">
      {/* Image */}
      <div className="w-20 h-20 bg-page-2 rounded-xl overflow-hidden flex-shrink-0">
        {item.image
          ? <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-2xl">🧴</div>
        }
      </div>
      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link href={`/shop/${item.id}`} className="font-bold text-sm hover:text-rose line-clamp-2">
          {item.name}
        </Link>
        <p className="text-xs text-ink-3 mb-2">{item.brand}</p>
        {/* Qty controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => updateQty(item.id, item.quantity - 1)}
            className="w-7 h-7 rounded-lg border-2 border-bdr flex items-center justify-center text-sm font-bold hover:border-rose hover:text-rose transition-colors">
            −
          </button>
          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
          <button onClick={() => updateQty(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg border-2 border-bdr flex items-center justify-center text-sm font-bold hover:border-rose hover:text-rose transition-colors">
            +
          </button>
          <button onClick={() => removeItem(item.id)}
            className="ml-2 text-xs text-ink-3 hover:text-rose transition-colors">
            Remove
          </button>
        </div>
      </div>
      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="font-black text-sm">{fmtPrice(item.price * item.quantity)}</p>
        {item.quantity > 1 && <p className="text-xs text-ink-3">{fmtPrice(item.price)} each</p>}
      </div>
    </div>
  )
}
