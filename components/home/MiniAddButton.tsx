'use client'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'

export default function MiniAddButton({ product, className }: { product: any; className?: string }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [warning, setWarning] = useState('')
  const outOfStock = (product.stock_count ?? 0) <= 0

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    const result = addItem({ id: product.id, name: product.name, brand: product.brand, price: product.price, image: product.images?.[0], stock: product.stock_count })
    if (result?.error) { setWarning(result.error); setTimeout(() => setWarning(''), 2200); return }
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <span className={`relative inline-block ${className || ''}`}>
      <button type="button" onClick={handleClick} disabled={outOfStock} aria-label="Add to cart"
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-colors ${added ? 'bg-gn text-white' : 'bg-white text-ink hover:bg-rose hover:text-white'} disabled:opacity-40`}>
        {added ? '✓' : '🛒'}
      </button>
      {warning && (
        <span className="absolute bottom-full right-0 mb-1 whitespace-nowrap bg-ink text-white text-2xs font-semibold px-2 py-1 rounded-lg z-10">
          {warning}
        </span>
      )}
    </span>
  )
}
