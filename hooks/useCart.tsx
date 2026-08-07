'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export interface CartItem {
  id: string; name: string; brand: string; price: number
  image?: string; quantity: number
  stock: number // max purchasable, mirrors the admin-set stock_count at the time it was added
}

interface AddItemInput { id: string; name: string; brand: string; price: number; image?: string; stock: number }

interface CartContextValue {
  items: CartItem[]
  addItem: (item: AddItemInput) => { error?: string }
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => { error?: string }
  clearCart: () => void
  total: number
  count: number
}

const CART_KEY = 'gn_cart'
export const FREE_DELIVERY_THRESHOLD = 5000 // £50 — single source of truth, used by cart popup, /cart, and /checkout
export const DELIVERY_FEE = 299 // £2.99 flat rate below the free-delivery threshold
export function calcDelivery(total: number) {
  return total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(CART_KEY) || '[]')) } catch {}
    setLoaded(true)
  }, [])

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
  }, [])

  const addItem = useCallback((item: AddItemInput): { error?: string } => {
    if (item.stock <= 0) return { error: 'This product is out of stock.' }
    let result: { error?: string } = {}
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stock) {
          result = { error: `Only ${item.stock} in stock — you already have the maximum in your cart.` }
          return prev
        }
        const next = prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, stock: item.stock } : i)
        if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
        return next
      }
      const next = [...prev, { ...item, quantity: 1 }]
      if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
      return next
    })
    return result
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updateQty = useCallback((id: string, qty: number): { error?: string } => {
    let result: { error?: string } = {}
    if (qty < 1) {
      setItems(prev => {
        const next = prev.filter(i => i.id !== id)
        if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
        return next
      })
      return result
    }
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item && qty > item.stock) {
        result = { error: `Only ${item.stock} in stock.` }
        qty = item.stock
      }
      const next = prev.map(i => i.id === id ? { ...i, quantity: qty } : i)
      if (typeof window !== 'undefined') localStorage.setItem(CART_KEY, JSON.stringify(next))
      return next
    })
    return result
  }, [])

  const clearCart = useCallback(() => persist([]), [persist])

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  const value = useMemo(() => ({
    items: loaded ? items : [], addItem, removeItem, updateQty, clearCart, total, count,
  }), [items, loaded, addItem, removeItem, updateQty, clearCart, total, count])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    // Should never happen (CartProvider wraps the whole app in the root layout), but
    // fail soft instead of crashing the page if it's ever used outside the provider.
    return { items: [], addItem: () => ({ error: 'Cart unavailable' }), removeItem: () => {}, updateQty: () => ({}), clearCart: () => {}, total: 0, count: 0 }
  }
  return ctx
}
