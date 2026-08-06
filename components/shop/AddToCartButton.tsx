'use client'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { fmtPrice } from '@/lib/utils'

interface Props {
  product: {
    id: string; name: string; brand: string
    price: number; images?: string[]; stock_count: number
  }
}

export default function AddToCartButton({ product }: Props) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.find(i => i.id === product.id)
  const outOfStock = product.stock_count <= 0

  function handleAdd() {
    if (outOfStock) return
    addItem({
      id: product.id, name: product.name, brand: product.brand,
      price: product.price, image: product.images?.[0],
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (outOfStock) return (
    <button disabled className="btn w-full justify-center text-base py-4 bg-page-2 text-ink-3 cursor-not-allowed mb-3">
      Out of Stock
    </button>
  )

  return (
    <button onClick={handleAdd}
      className={`btn w-full justify-center text-base py-4 mb-3 transition-all ${added ? 'bg-gn text-white' : 'btn-primary'}`}>
      {added
        ? `✓ Added to Cart!`
        : inCart
          ? `Add Another — ${fmtPrice(product.price)}`
          : `Add to Cart — ${fmtPrice(product.price)}`
      }
    </button>
  )
}
