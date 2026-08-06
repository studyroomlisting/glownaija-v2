import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'green' | 'gold' | 'rose' | 'blue' | 'gray'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-page-2 text-ink-3',
    green:   'bg-green-100 text-green-700',
    gold:    'bg-yellow-100 text-yellow-700',
    rose:    'bg-rose-100 text-rose',
    blue:    'bg-blue-100 text-blue-700',
    gray:    'bg-gray-100 text-gray-500',
  }
  return <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-bold', variants[variant], className)}>{children}</span>
}
