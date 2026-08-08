'use client'
import { useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  {
    q: 'What is your hair type?',
    sub: 'This helps us personalise the best recommendations for you.',
    opts: [
      { label: '4C - Tight coils',      icon: '🌀' },
      { label: '4B - Z-shape coils',    icon: '〰️' },
      { label: '4A - Loose coils',      icon: '➰' },
      { label: '3C - Kinky curls',      icon: '🌪️' },
      { label: 'Wig/Weave',             icon: '💁🏾‍♀️' },
      { label: 'Relaxed/Texturized',    icon: '〰️' },
      { label: 'Mixed texture',         icon: '⚬' },
    ],
  },
  {
    q: 'What service are you looking for?',
    sub: "We'll match you with salons that specialise in this.",
    opts: [
      { label: 'Braids & Twists',       icon: '🎀' },
      { label: 'Locs',                  icon: '🌿' },
      { label: 'Wigs & Weaves',         icon: '👑' },
      { label: 'Natural Hair Styling',  icon: '✨' },
      { label: 'Colour & Treatments',   icon: '🎨' },
      { label: 'Barber Services',       icon: '💈' },
      { label: 'Makeup',                icon: '💄' },
      { label: 'Nails',                 icon: '💅' },
    ],
  },
  {
    q: 'Which city are you in?',
    sub: 'So we can find salons near you.',
    opts: [
      { label: 'London',      icon: '📍' },
      { label: 'Birmingham',  icon: '📍' },
      { label: 'Manchester',  icon: '📍' },
      { label: 'Leeds',       icon: '📍' },
      { label: 'Bristol',     icon: '📍' },
      { label: 'Other',       icon: '📍' },
    ],
  },
  {
    q: 'What is your budget per visit?',
    sub: "We'll match salons within your price range.",
    opts: [
      { label: 'Under £30',   icon: '💷' },
      { label: '£30-£60',     icon: '💷' },
      { label: '£60-£100',    icon: '💷' },
      { label: '£100-£150',   icon: '💷' },
      { label: 'Over £150',   icon: '💷' },
    ],
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
        <span className="badge-pill bg-rose-50 text-rose text-xs font-bold mb-4 inline-flex items-center gap-1">✦ AI Powered</span>
        <h1 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">
          AI Stylist <span className="text-gold text-2xl">✨</span>
        </h1>
        <p className="text-ink-3">Answer 4 quick questions to find your perfect salon match</p>
      </div>

      {step < QUESTIONS.length ? (
        <div className="card card-body">
          {/* Progress: dot-and-line style */}
          <div className="flex items-center justify-center mb-7 px-4">
            {QUESTIONS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${i < step ? 'bg-rose' : i === step ? 'bg-rose ring-4 ring-rose/20' : 'bg-page-2 border-2 border-bdr'}`}/>
                {i < QUESTIONS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 transition-colors ${i < step ? 'bg-rose' : 'bg-bdr'}`}/>
                )}
              </div>
            ))}
          </div>

          {/* Icon header */}
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-2xl mx-auto mb-5">
            💇🏾‍♀️
          </div>

          <h2 className="font-black text-xl mb-1.5 text-center">{QUESTIONS[step].q}</h2>
          <p className="text-ink-3 text-sm text-center mb-6">{QUESTIONS[step].sub}</p>

          <div className="grid grid-cols-1 gap-2">
            {QUESTIONS[step].opts.map(o => (
              <button key={o.label} onClick={() => pick(o.label)}
                className="flex items-center gap-3 text-left px-4 py-3 bg-white border-2 border-bdr rounded-xl hover:border-rose hover:bg-rose-50 transition-all group">
                <span className="w-9 h-9 rounded-full bg-rose-50 group-hover:bg-white flex items-center justify-center text-base flex-shrink-0 transition-colors">
                  {o.icon}
                </span>
                <span className="flex-1 font-semibold text-sm text-ink-2 group-hover:text-rose transition-colors">{o.label}</span>
                <span className="text-ink-3 group-hover:text-rose transition-colors flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card card-body text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="font-black text-xl mb-4">We found your matches!</h2>
          <div className="text-left space-y-2 mb-6 text-sm bg-page-2 rounded-xl p-4">
            {answers.map((a, i) => (
              <p key={i} className="text-ink-2">
                <strong>{QUESTIONS[i].q.replace('?', '')}:</strong> {a}
              </p>
            ))}
          </div>
          <Link href={`/salons?city=${city}&service=${service}`}
            className="btn btn-primary w-full justify-center text-base py-3.5 mb-3 block">
            View Matching Salons
          </Link>
          <button onClick={() => { setStep(0); setAnswers([]) }}
            className="text-sm text-ink-3 hover:underline">
            Start over
          </button>
        </div>
      )}

      {step < QUESTIONS.length && (
        <p className="text-center mt-6">
          <span className="badge-pill bg-rose-50 text-rose text-2xs font-semibold inline-flex items-center gap-1">
            🔒 Your answers are private and secure
          </span>
        </p>
      )}
    </div>
  )
}
