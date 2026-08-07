'use client'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'

interface Props {
  product: { id: string; name: string; brand: string; price: number; images?: string[]; stock_count: number }
}

export default function QuickAddButton({ product }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock_count <= 0

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({ id: product.id, name: product.name, brand: product.brand, price: product.price, image: product.images?.[0] })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (outOfStock) {
    return <span className="btn btn-sm bg-page-2 text-ink-3 cursor-not-allowed text-xs">Sold out</span>
  }

  return (
    <button type="button" onClick={handleClick}
      className={`btn btn-sm text-xs transition-colors ${added ? 'bg-gn text-white' : 'btn-primary'}`}>
      {added ? '✓ Added' : 'Add'}
    </button>
  )
}
