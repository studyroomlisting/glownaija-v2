'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { fmtPrice } from '@/lib/utils'
import CartItem from './CartItem'

export default function CartSidebar() {
  const { items, count, total, clearCart } = useCart()
  const [open, setOpen] = useState(false)
  const DELIVERY = 299 // £2.99

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Cart trigger button */}
      <button onClick={() => setOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors" aria-label="Shopping cart">
        🛒
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-2xs font-bold text-white bg-rose rounded-full px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)}/>}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-bdr">
          <h2 className="font-black text-lg">Your Cart ({count} item{count !== 1 ? 's' : ''})</h2>
          <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page-2 text-ink-3">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {!items.length ? (
            <div className="text-center py-16 text-ink-3">
              <p className="text-5xl mb-3">🛒</p>
              <p className="font-bold text-lg mb-1">Your cart is empty</p>
              <p className="text-sm mb-4">Browse our beauty shop to add products</p>
              <button onClick={() => setOpen(false)} className="btn btn-primary btn-sm">
                <Link href="/shop">Browse Shop →</Link>
              </button>
            </div>
          ) : (
            <>
              {items.map(item => <CartItem key={item.id} item={item}/>)}
              <button onClick={clearCart} className="text-xs text-ink-3 hover:text-rose mt-2 block">Clear cart</button>
            </>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="border-t border-bdr px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-ink-3">
              <span>Subtotal</span>
              <span>{fmtPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-3">
              <span>Delivery</span>
              <span>{fmtPrice(DELIVERY)}</span>
            </div>
            <div className="flex justify-between font-black text-base pt-2 border-t border-bdr">
              <span>Total</span>
              <span>{fmtPrice(total + DELIVERY)}</span>
            </div>
            <Link href="/checkout" onClick={() => setOpen(false)}
              className="btn btn-primary w-full justify-center text-base py-3.5 block text-center mt-3">
              Checkout → {fmtPrice(total + DELIVERY)}
            </Link>
            <p className="text-xs text-ink-3 text-center">Secure checkout via Stripe · Free returns</p>
          </div>
        )}
      </div>
    </>
  )
}
