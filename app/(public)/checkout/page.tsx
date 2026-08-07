'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart, calcDelivery } from '@/hooks/useCart'
import { fmtPrice, isValidUKPostcode, isValidName } from '@/lib/utils'

export default function CheckoutPage() {
  const { items, total, count, clearCart } = useCart()
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [mounted,   setMounted]   = useState(false)
  const [coupon,    setCoupon]    = useState<any>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Pick up a coupon already applied on the cart page, if any
    const params = new URLSearchParams(window.location.search)
    const couponId = params.get('coupon')
    if (couponId) {
      const saved = sessionStorage.getItem('gn_coupon')
      if (saved) setCoupon(JSON.parse(saved))
    }
  }, [])

  const deliveryCost = calcDelivery(total)
  const discount     = coupon?.discount_pence || 0
  const orderTotal   = Math.max(0, total + deliveryCost - discount)

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError(''); setCoupon(null)
    const res = await fetch(`/api/coupon-validate?code=${encodeURIComponent(couponCode)}&order_total=${total}`)
    const data = await res.json()
    if (data.error) setCouponError(data.error)
    else { setCoupon(data); sessionStorage.setItem('gn_coupon', JSON.stringify(data)) }
    setCouponLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)

    if (!items.length) { setError('Your cart is empty.'); setLoading(false); return }

    const fd       = new FormData(e.currentTarget)
    const fullName = (fd.get('full_name') as string).trim()
    const postcode = (fd.get('postcode') as string).trim().toUpperCase()

    if (!isValidName(fullName)) { setError('Please enter your full name (letters only).'); setLoading(false); return }
    if (!isValidUKPostcode(postcode)) { setError('Please enter a valid UK postcode (e.g. SE15 5DT).'); setLoading(false); return }

    const res  = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        full_name:     fullName,
        address:       fd.get('address'),
        city:          fd.get('city'),
        postcode,
        delivery_cost: deliveryCost,
        coupon_id:     coupon?.coupon_id || null,
      }),
    })
    const data = await res.json()
    if (data.url) {
      clearCart()
      window.location.href = data.url
    } else {
      setError(data.error || 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (!items.length) return (
    <div className="container py-20 text-center">
      <div className="text-7xl mb-4">🛒</div>
      <h2 className="text-2xl font-black mb-3">Your cart is empty</h2>
      <Link href="/shop" className="btn btn-primary">Browse Shop →</Link>
    </div>
  )

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-ink to-purple-900 py-8">
        <div className="container">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Link href="/cart" className="hover:text-white">Cart</Link><span>/</span><span className="text-white">Checkout</span>
          </div>
          <h1 className="text-white text-3xl font-black">Checkout</h1>
          <p className="text-white/60 text-sm mt-1">Review your cart and complete your order</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">

          {/* ── Form column ─────────────────────────────── */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="alert-error">{error}</div>}

              <div className="card card-body">
                <h2 className="font-bold text-lg mb-4">📦 Delivery Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input name="full_name" className="input" placeholder="Amara Okafor" pattern="[A-Za-z][A-Za-z\s'.-]{1,59}" title="Letters only" required/>
                  </div>
                  <div>
                    <label className="label">Street Address *</label>
                    <input name="address" className="input" placeholder="12 Peckham High Street" required/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">City *</label>
                      <input name="city" className="input" placeholder="London" required/>
                    </div>
                    <div>
                      <label className="label">Postcode *</label>
                      <input name="postcode" className="input" placeholder="SE15 5DT"
                        style={{ textTransform:'uppercase' }} required
                        pattern="[A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]?\s?[0-9][A-Za-z]{2}" title="Enter a valid UK postcode"
                        onChange={e => e.target.value = e.target.value.toUpperCase()}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">🏷️ Discount Code</h2>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="input flex-1" placeholder="Enter code e.g. WELCOME10"/>
                  <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                    className="btn btn-outline disabled:opacity-50">
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-rose font-semibold mt-2">{couponError}</p>}
                {coupon && <p className="text-xs text-gn font-semibold mt-2">✓ {coupon.description} applied</p>}
                <p className="text-2xs text-ink-3 mt-2">Try: WELCOME10 · GLOW20 · SAVE5</p>
              </div>

              <div className="card card-body">
                <h2 className="font-bold text-lg mb-3">Payment</h2>
                <p className="text-ink-3 text-sm mb-4">
                  You'll be redirected to Stripe's secure checkout to complete payment. We accept Visa, Mastercard, Amex, Apple Pay and Google Pay.
                </p>
                <div className="flex gap-3 mb-4">
                  {['VISA','MC','AMEX','Apple Pay','Google Pay'].map(c => (
                    <span key={c} className="text-2xs font-bold text-ink-3 px-2 py-1 bg-page-2 rounded border border-bdr">{c}</span>
                  ))}
                </div>

                <button type="submit" disabled={loading}
                  className="btn btn-primary w-full justify-center text-base py-4 disabled:opacity-50">
                  {loading ? 'Redirecting to Stripe…' : `🔒 Pay ${fmtPrice(orderTotal)} with Stripe →`}
                </button>
                <p className="text-xs text-ink-3 text-center mt-2 flex items-center justify-center gap-1">
                  <span>🔒</span> Secure payment. We never store card details.
                </p>
              </div>
            </form>
          </div>

          {/* ── Order summary ────────────────────────────────────── */}
          <div className="card card-body sticky top-20">
            <h2 className="font-bold text-lg mb-4">Order Summary ({count} item{count!==1?'s':''})</h2>

            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-page-2 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-xl">🧴</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{item.name}</p>
                    <p className="text-xs text-ink-3">{item.brand} · Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0">{fmtPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-bdr">
              <div className="flex justify-between text-sm text-ink-3">
                <span>Subtotal</span><span>{fmtPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-3">
                <span>Delivery</span>
                <span className={deliveryCost===0?'text-gn font-semibold':''}>
                  {deliveryCost===0?'🆓 Free':fmtPrice(deliveryCost)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-gn font-semibold">
                  <span>Discount ({coupon?.code})</span>
                  <span>−{fmtPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg pt-3 border-t border-bdr">
                <span>Total</span><span>{fmtPrice(orderTotal)}</span>
              </div>
            </div>

            <Link href="/cart" className="text-xs text-rose font-bold hover:underline block mt-4 text-center">
              ← Edit cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
