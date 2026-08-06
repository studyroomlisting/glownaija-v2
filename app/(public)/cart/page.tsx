'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { fmtPrice } from '@/lib/utils'
import CartItem from '@/components/shop/CartItem'

const DELIVERY = 299 // £2.99 flat rate
const FREE_DELIVERY_THRESHOLD = 5000 // free over £50

export default function CartPage() {
  const { items, count, total, clearCart } = useCart()
  const [couponCode, setCouponCode]     = useState('')
  const [couponData, setCouponData]     = useState<any>(null)
  const [couponError, setCouponError]   = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError(''); setCouponData(null)
    const res = await fetch(`/api/coupon-validate?code=${encodeURIComponent(couponCode)}&order_total=${total}`)
    const data = await res.json()
    if (data.error) { setCouponError(data.error); }
    else { setCouponData(data) }
    setCouponLoading(false)
  }

  if (!mounted) return null // prevent SSR mismatch

  const deliveryCost   = total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY
  const discount       = couponData?.discount_pence || 0
  const orderTotal     = Math.max(0, total + deliveryCost - discount)
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - total)

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-black mb-2">Shopping Cart</h1>
      <p className="text-ink-3 text-sm mb-8">{count} item{count !== 1 ? 's' : ''}</p>

      {!items.length ? (
        <div className="text-center py-20 text-ink-3">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="text-2xl font-black mb-3">Your cart is empty</h2>
          <p className="text-ink-3 mb-6">Browse our Afro &amp; Caribbean beauty shop to add products</p>
          <Link href="/shop" className="btn btn-primary text-base px-8 py-3.5">Browse Shop →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="card card-body mb-4">
              {items.map(item => <CartItem key={item.id} item={item}/>)}
              <div className="flex justify-between items-center pt-4">
                <button onClick={clearCart} className="text-sm text-ink-3 hover:text-rose transition-colors">
                  🗑 Clear cart
                </button>
                <Link href="/shop" className="text-sm text-rose font-bold hover:underline">
                  ← Continue shopping
                </Link>
              </div>
            </div>

            {/* Coupon code */}
            <div className="card card-body">
              <h3 className="font-bold mb-3">Promo Code</h3>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setCouponData(null) }}
                  className="input flex-1" placeholder="Enter code e.g. GLOW20"
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                />
                <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="btn btn-primary disabled:opacity-50">
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-rose text-sm mt-2">⚠ {couponError}</p>}
              {couponData  && <p className="text-gn text-sm mt-2 font-semibold">✓ {couponData.description} applied!</p>}
            </div>
          </div>

          {/* Order summary */}
          <div className="card card-body sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>

            {/* Free delivery progress */}
            {toFreeDelivery > 0 && (
              <div className="bg-page-2 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold mb-1.5">
                  Spend <strong>{fmtPrice(toFreeDelivery)}</strong> more for free delivery
                </p>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-gn rounded-full transition-all"
                    style={{ width: `${Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100)}%` }}/>
                </div>
              </div>
            )}
            {toFreeDelivery === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-gn text-sm font-semibold">
                🎉 You've unlocked free delivery!
              </div>
            )}

            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-3">Subtotal ({count} items)</span>
                <span>{fmtPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-3">Delivery</span>
                <span className={deliveryCost === 0 ? 'text-gn font-semibold' : ''}>
                  {deliveryCost === 0 ? '🆓 Free' : fmtPrice(deliveryCost)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gn font-semibold">Promo ({couponData?.code})</span>
                  <span className="text-gn font-semibold">−{fmtPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg pt-3 border-t border-bdr">
                <span>Total</span>
                <span>{fmtPrice(orderTotal)}</span>
              </div>
            </div>

            <Link href={`/checkout${couponData ? `?coupon=${couponData.coupon_id}` : ''}`}
              className="btn btn-primary w-full justify-center text-base py-4 block text-center">
              Proceed to Checkout →
            </Link>

            <div className="flex items-center gap-2 justify-center mt-4 text-xs text-ink-3">
              <span>🔒</span>
              <span>Secure checkout via Stripe. We accept all major cards.</span>
            </div>

            <div className="flex justify-center gap-4 mt-3">
              {['VISA', 'Mastercard', 'Amex', 'Apple Pay'].map(card => (
                <span key={card} className="text-2xs font-bold text-ink-3 px-2 py-1 bg-page-2 rounded">{card}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended products */}
      <div className="mt-12">
        <h2 className="font-black text-xl mb-4">You Might Also Like</h2>
        <div className="grid-4">
          <Link href="/shop" className="card card-body text-center py-8 text-ink-3 hover:border-rose hover:text-rose transition-all">
            <div className="text-3xl mb-2">🛍️</div>
            <div className="font-bold text-sm">Browse All Products</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
