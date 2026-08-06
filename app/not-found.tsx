import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center text-center p-8">
      <div>
        <div className="text-8xl mb-4">💆</div>
        <h1 className="text-7xl font-black mb-3">404</h1>
        <h2 className="text-xl font-bold mb-3">Page Not Found</h2>
        <p className="text-ink-3 mb-8">The page you're looking for doesn't exist.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="btn btn-primary">Go to Homepage →</Link>
          <Link href="/salons" className="btn btn-outline">Find a Salon</Link>
          <Link href="/shop" className="btn btn-outline">Browse Shop</Link>
        </div>
      </div>
    </div>
  )
}
