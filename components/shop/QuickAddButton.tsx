'use client'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'

interface Props {
  product: { id: string; name: string; brand: string; price: number; images?: string[]; stock_count: number }
}

export default function QuickAddButton({ product }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [warning, setWarning] = useState('')
  const outOfStock = product.stock_count <= 0

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    const result = addItem({ id: product.id, name: product.name, brand: product.brand, price: product.price, image: product.images?.[0], stock: product.stock_count })
    if (result?.error) {
      setWarning(result.error)
      setTimeout(() => setWarning(''), 2500)
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (outOfStock) {
    return <span className="btn btn-sm bg-page-2 text-ink-3 cursor-not-allowed text-xs">Sold out</span>
  }

  return (
    <span className="relative inline-block">
      <button type="button" onClick={handleClick}
        className={`btn btn-sm text-xs transition-colors ${added ? 'bg-gn text-white' : 'btn-primary'}`}>
        {added ? '✓ Added' : 'Add'}
      </button>
      {warning && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap bg-ink text-white text-2xs font-semibold px-2 py-1 rounded-lg z-10">
          {warning}
        </span>
      )}
    </span>
  )
}
