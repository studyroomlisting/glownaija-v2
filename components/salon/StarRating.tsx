'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value?: number
  onChange?: (val: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-4xl' }
  const current = hovered || value
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(star => (
        <span key={star}
          className={cn(sizes[size], readonly ? '' : 'cursor-pointer select-none', 'transition-colors')}
          style={{ color: star <= current ? '#D4AF37' : '#E8E0D8' }}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}>★</span>
      ))}
    </div>
  )
}
