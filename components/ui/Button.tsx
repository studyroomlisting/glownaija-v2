import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'green' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-rose text-white hover:bg-rose-dark',
      outline: 'bg-white text-ink border-2 border-bdr hover:border-rose hover:text-rose',
      green:   'bg-gn text-white hover:opacity-90',
      ghost:   'bg-transparent text-ink hover:bg-page-2',
      danger:  'bg-red-500 text-white hover:bg-red-600',
    }
    const sizes = { sm: 'px-3 py-2 text-xs rounded-lg', md: 'px-5 py-2.5 text-sm rounded-xl', lg: 'px-6 py-3.5 text-base rounded-xl' }
    return (
      <button ref={ref} disabled={disabled || loading}
        className={cn('inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant], sizes[size], className)} {...props}>
        {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
