'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CartItem {
  id: string; name: string; brand: string; price: number
  image?: string; quantity: number
}

const CART_KEY = 'gn_cart'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(CART_KEY) || '[]')) } catch {}
  }, [])

  const save = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
    localStorage.setItem(CART_KEY, JSON.stringify(newItems))
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      const next = existing
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }]
      localStorage.setItem(CART_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    save(items.filter(i => i.id !== id))
  }, [items, save])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return }
    save(items.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }, [items, save, removeItem])

  const clearCart = useCallback(() => { save([]) }, [save])

  const total    = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const count    = items.reduce((s, i) => s + i.quantity, 0)

  return { items, addItem, removeItem, updateQty, clearCart, total, count }
}
