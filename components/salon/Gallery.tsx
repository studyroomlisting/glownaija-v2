'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    if (openIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowRight') setOpenIndex(i => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft')  setOpenIndex(i => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [openIndex, images.length])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button key={i} type="button" onClick={() => setOpenIndex(i)}
            className="relative aspect-square rounded-xl overflow-hidden bg-page-2 group">
            <Image src={img} alt={`${alt} photo ${i + 1}`} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300"/>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setOpenIndex(null)}>
          <button type="button" onClick={() => setOpenIndex(null)} aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">✕</button>

          {images.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); setOpenIndex((openIndex - 1 + images.length) % images.length) }}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">‹</button>
          )}

          <div className="relative w-full max-w-3xl h-[70vh]" onClick={e => e.stopPropagation()}>
            <Image src={images[openIndex]} alt={`${alt} photo ${openIndex + 1}`} fill sizes="90vw" className="object-contain"/>
          </div>

          {images.length > 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); setOpenIndex((openIndex + 1) % images.length) }}
              aria-label="Next photo"
              className="absolute right-2 sm:right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl">›</button>
          )}

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-bold">{openIndex + 1} / {images.length}</span>
        </div>
      )}
    </>
  )
}
