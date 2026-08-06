'use client'
import { useState } from 'react'

interface Props {
  productId: string
  initialSaved: boolean
}

export default function WishlistButton({ productId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/save-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    const data = await res.json()
    if (!data.error) setSaved(data.saved)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="btn btn-outline w-full justify-center mb-4">
      {loading ? '…' : saved ? '❤️ Saved to Wishlist' : '🤍 Save to Wishlist'}
    </button>
  )
}
