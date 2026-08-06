'use client'
import { useEffect, useState } from 'react'

interface ToastProps { message: string; type?: 'success' | 'error'; duration?: number; onClose: () => void }

export default function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  useEffect(() => { const t = setTimeout(onClose, duration); return () => clearTimeout(t) }, [duration, onClose])
  return (
    <div role="status" aria-live="polite"
      className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold animate-slide-in ${type === 'success' ? 'bg-gn' : 'bg-rose'}`}>
      {type === 'success' ? '✓ ' : '⚠ '}{message}
      <button onClick={onClose} aria-label="Dismiss notification" className="ml-3 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}
