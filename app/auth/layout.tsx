import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <div className="py-5 text-center border-b border-bdr bg-white">
        <Link href="/" className="text-xl font-black">
          <span className="text-rose">Glow</span>
          <span className="text-ink">Naija</span>
        </Link>
      </div>
      <div id="main-content" className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
