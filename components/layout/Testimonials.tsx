'use client'
import { useState } from 'react'

const TESTIMONIALS = [
  { text: "GlowNaija makes it so easy to find the best salons near me. I love how simple the booking process is!", name: 'Chioma A.', initial: 'C' },
  { text: "Finally found a braider who understands 4C hair! Booked through GlowNaija and the experience was seamless.", name: 'Adaeze O.', initial: 'A' },
  { text: "The salon I found does the most beautiful locs installations. GlowNaija made it so easy to find and book.", name: 'Funmi B.', initial: 'F' },
  { text: "Brilliant platform. I've discovered so many amazing Afro-Caribbean salons near me I didn't know existed.", name: 'Kezia M.', initial: 'K' },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  const t = TESTIMONIALS[i]
  const prev = () => setI(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  const next = () => setI(p => (p + 1) % TESTIMONIALS.length)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={prev} aria-label="Previous testimonial"
          className="hidden sm:flex w-10 h-10 rounded-full bg-white shadow-md items-center justify-center text-ink-3 hover:text-rose flex-shrink-0">‹</button>

        <div className="card card-body text-center flex-1">
          <p className="text-ink-2 italic mb-4">"{t.text}"</p>
          <div className="flex items-center justify-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-rose to-gold flex items-center justify-center text-white text-xs font-black">{t.initial}</span>
            <div className="text-left">
              <p className="font-bold text-sm">{t.name}</p>
              <p className="text-gold text-xs">★★★★★</p>
            </div>
          </div>
        </div>

        <button type="button" onClick={next} aria-label="Next testimonial"
          className="hidden sm:flex w-10 h-10 rounded-full bg-white shadow-md items-center justify-center text-ink-3 hover:text-rose flex-shrink-0">›</button>
      </div>

      <div className="flex justify-center gap-1.5 mt-5">
        {TESTIMONIALS.map((_, idx) => (
          <button key={idx} type="button" onClick={() => setI(idx)} aria-label={`Testimonial ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-rose' : 'w-1.5 bg-bdr'}`} />
        ))}
      </div>
    </div>
  )
}
