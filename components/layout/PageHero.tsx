import { cn } from '@/lib/utils'

interface PageHeroProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export default function PageHero({ title, subtitle, children, className }: PageHeroProps) {
  return (
    <div className={cn('page-hero', className)}>
      <div className="container">
        {children}
        <h1 className="text-3xl font-black mb-2">{title}</h1>
        {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}
