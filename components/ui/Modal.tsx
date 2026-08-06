'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      // Move focus into the dialog so keyboard/screen-reader users land somewhere sensible.
      (closeBtnRef.current || panelRef.current)?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={cn('bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto', maxWidth)}
        onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-bdr">
            <h3 id="modal-title" className="font-bold text-lg">{title}</h3>
            <button ref={closeBtnRef} onClick={onClose} aria-label="Close dialog"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-page-2 text-ink-3 transition-colors">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
