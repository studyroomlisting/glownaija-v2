'use client'
import { useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  {
    q: 'What is your hair type?',
    opts: ['4C - Tight coils', '4B - Z-shape coils', '4A - Loose coils', '3C - Kinky curls', 'Wig/Weave', 'Relaxed/Texturized', 'Mixed texture'],
  },
  {
    q: 'What service are you looking for?',
    opts: ['Braids & Twists', 'Locs', 'Wigs & Weaves', 'Natural Hair Styling', 'Colour & Treatments', 'Barber Services', 'Makeup', 'Nails'],
  },
  {
    q: 'Which city are you in?',
    opts: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Bristol', 'Other'],
  },
  {
    q: 'What is your budget per visit?',
    opts: ['Under £30', '£30-£60', '£60-£100', '£100-£150', 'Over £150'],
  },
]

export default function StylistPage() {
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState<string[]>([])

  function pick(opt: string) {
    const a = [...answers, opt]
    if (step < QUESTIONS.length - 1) {
      setAnswers(a)
      setStep(s => s + 1)
    } else {
      setAnswers(a)
      setStep(QUESTIONS.length)
    }
  }

  const city    = answers[2]?.split(' ')[0] || 'London'
  const service = answers[1]?.split(' ')[0]?.toLowerCase() || 'braids'

  return (
    <div className="container py-12" style={{ maxWidth: '32rem' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">AI Stylist</h1>
        <p style={{ color: 'var(--ink-3)' }}>Answer 4 quick questions to find your perfect salon match</p>
      </div>

      {step < QUESTIONS.length ? (
        <div className="card card-body">
          {/* Progress dots */}
          <div className="flex gap-1 mb-6 justify-center">
            {QUESTIONS.map((_, i) => (
              <div key={i} className="h-1.5 w-8 rounded-full"
                style={{ background: i <= step ? 'var(--rose)' : 'var(--page-2)' }}/>
            ))}
          </div>

          <h2 className="font-black text-xl mb-6 text-center">{QUESTIONS[step].q}</h2>

          <div className="grid grid-cols-1 gap-2">
            {QUESTIONS[step].opts.map(o => (
              <button key={o} onClick={() => pick(o)}
                className="btn btn-outline text-left px-5 py-3"
                style={{ justifyContent: 'flex-start' }}>
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card card-body text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="font-black text-xl mb-4">We found your matches!</h2>
          <div className="text-left space-y-2 mb-6 text-sm rounded-xl p-4" style={{ background: 'var(--page-2)' }}>
            {answers.map((a, i) => (
              <p key={i} style={{ color: 'var(--ink-2)' }}>
                <strong>{QUESTIONS[i].q.replace('?', '')}:</strong> {a}
              </p>
            ))}
          </div>
          <Link href={`/salons?city=${city}&service=${service}`}
            className="btn btn-primary w-full justify-center text-base py-3.5 mb-3 block">
            View Matching Salons
          </Link>
          <button onClick={() => { setStep(0); setAnswers([]) }}
            className="text-sm hover:underline" style={{ color: 'var(--ink-3)' }}>
            Start over
          </button>
        </div>
      )}
    </div>
  )
}
