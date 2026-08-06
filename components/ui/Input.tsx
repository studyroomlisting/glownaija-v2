import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-1.5">{label}</label>}
      <input ref={ref}
        className={cn('w-full border-2 border-bdr rounded-xl px-4 py-3 text-sm font-sans outline-none transition-colors focus:border-rose bg-white',
          error && 'border-red-400', className)} {...props} />
      {hint  && !error && <p className="text-xs text-ink-3 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
export default Input
