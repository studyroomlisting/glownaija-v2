import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Header />
      <div id="main-content" className="flex-1 flex items-center justify-center p-4 py-10">
        {children}
      </div>
      <Footer />
    </div>
  )
}
