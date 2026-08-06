'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Context {
  hairType?: string
  city?: string
}

const SUGGESTED_PROMPTS = [
  { emoji: '✂️', text: 'How do I care for 4C natural hair?' },
  { emoji: '🌿', text: 'Best products for locs maintenance?' },
  { emoji: '💧', text: 'My hair is dry and breaking — what should I do?' },
  { emoji: '👑', text: 'How do I choose the right wig for my face shape?' },
  { emoji: '💅', text: 'What skincare routine works for melanin-rich skin?' },
  { emoji: '🔍', text: 'Find me a braider in London' },
  { emoji: '💆', text: 'How often should I wash natural hair?' },
  { emoji: '🧴', text: 'What ingredients should I avoid for Afro hair?' },
]

const HAIR_TYPES = ['4C','4B','4A','3C','3B','Locs','Wig/Weave','Relaxed','Mixed']
const CITIES     = ['London','Birmingham','Manchester','Leeds','Bristol','Nottingham','Leicester','Glasgow','Liverpool','Other']

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm Glow AI ✨ — your personal Afro and Caribbean beauty assistant. I can help with hair care advice, product recommendations, skincare for melanin-rich skin, and finding the perfect salon on GlowNaija.\n\nWhat can I help you with today?",
}

export default function GlowAIChatPage() {
  const [messages,   setMessages]   = useState<Message[]>([WELCOME])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [context,    setContext]    = useState<Context>({})
  const [showSetup,  setShowSetup]  = useState(false)
  const [charCount,  setCharCount]  = useState(0)
  const endRef    = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const MAX_CHARS = 500

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setCharCount(0)
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.')
        setMessages(prev => prev.slice(0, -1)) // remove user message on error
        setInput(trimmed) // restore input
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setError('Could not connect to Glow AI. Check your internet connection.')
      setMessages(prev => prev.slice(0, -1))
      setInput(trimmed)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [messages, loading, context])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function clearChat() {
    setMessages([WELCOME])
    setError('')
    setInput('')
    setCharCount(0)
    inputRef.current?.focus()
  }

  // Format message — handle newlines and **bold**
  function formatContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Bold: **text**
      const formatted = line.split(/\*\*([^*]+)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mt-1">
            <span className="text-rose mt-0.5 flex-shrink-0">•</span>
            <span>{formatted.slice(1)}</span>
          </div>
        )
      }
      if (line === '') return <div key={i} className="h-2" />
      return <div key={i}>{formatted}</div>
    })
  }

  const hasContext = context.hairType || context.city

  return (
    <div className="flex flex-col bg-page" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-bdr px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-purple-700 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
            ✦
          </div>
          <div>
            <h1 className="font-black text-base leading-tight">Glow AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gn inline-block"/>
              <span className="text-xs text-ink-3">Afro &amp; Caribbean Beauty Expert</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className={`btn btn-sm text-xs ${hasContext ? 'bg-rose-50 text-rose border-rose/30 border' : 'btn-outline'}`}
            title="Personalise"
          >
            ⚙ {hasContext ? 'Personalised' : 'Personalise'}
          </button>
          {messages.length > 1 && (
            <button onClick={clearChat} className="btn btn-outline btn-sm text-xs text-ink-3">
              New chat
            </button>
          )}
        </div>
      </div>

      {/* ── Personalisation panel ──────────────────────────────────── */}
      {showSetup && (
        <div className="bg-rose-50 border-b border-rose/20 px-4 py-3 flex-shrink-0">
          <p className="text-xs font-bold text-rose mb-2">✦ Personalise your advice</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-2xs font-bold uppercase tracking-wide text-ink-3 block mb-1">Hair Type</label>
              <div className="flex flex-wrap gap-1.5">
                {HAIR_TYPES.map(h => (
                  <button key={h} onClick={() => setContext(c => ({ ...c, hairType: c.hairType === h ? undefined : h }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${context.hairType === h ? 'bg-rose text-white' : 'bg-white border border-bdr hover:border-rose'}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-2xs font-bold uppercase tracking-wide text-ink-3 block mb-1">My City</label>
              <div className="flex flex-wrap gap-1.5">
                {CITIES.map(c => (
                  <button key={c} onClick={() => setContext(ctx => ({ ...ctx, city: ctx.city === c ? undefined : c }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${context.city === c ? 'bg-rose text-white' : 'bg-white border border-bdr hover:border-rose'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasContext && (
            <p className="text-2xs text-ink-3 mt-2">
              ✓ Glow AI will personalise advice for {[context.hairType, context.city && context.city + ', UK'].filter(Boolean).join(' hair in ')}
            </p>
          )}
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose to-purple-700 flex items-center justify-center text-white text-sm font-black flex-shrink-0 mt-0.5">
                ✦
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-sm md:max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-rose text-white rounded-br-none'
                : 'bg-white border border-bdr rounded-bl-none shadow-sm'
            }`}>
              <div className="space-y-0.5">{formatContent(msg.content)}</div>

              {/* Quick action links in assistant messages */}
              {msg.role === 'assistant' && i > 0 && (
                (() => {
                  const c = msg.content.toLowerCase()
                  const links = []
                  if (c.includes('salon') || c.includes('book') || c.includes('find'))
                    links.push({ href:'/salons', label:'🔍 Find Salons' })
                  if (c.includes('product') || c.includes('shop') || c.includes('buy'))
                    links.push({ href:'/shop', label:'🛍️ Shop Products' })
                  if (c.includes('book') && c.includes('appointment'))
                    links.push({ href:'/booking', label:'📅 Book Now' })
                  if (!links.length) return null
                  return (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-bdr">
                      {links.map(l => (
                        <Link key={l.href} href={l.href}
                          className="text-xs font-bold text-rose hover:underline">
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )
                })()
              )}
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                You
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose to-purple-700 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              ✦
            </div>
            <div className="bg-white border border-bdr rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-ink-3"
                    style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
              ⚠ {error}
              <button onClick={() => setError('')} className="ml-1 hover:text-red-800">✕</button>
            </div>
          </div>
        )}

        {/* Suggested prompts — only show on first message */}
        {messages.length === 1 && !loading && (
          <div>
            <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-3 text-center">
              Popular questions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map(({ emoji, text }) => (
                <button key={text} onClick={() => sendMessage(text)}
                  className="flex items-center gap-2.5 text-left px-4 py-3 bg-white border border-bdr rounded-xl hover:border-rose hover:bg-rose-50 transition-all text-sm font-medium text-ink-2 group">
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  <span className="group-hover:text-rose transition-colors">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef}/>
      </div>

      {/* ── Input bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-t border-bdr px-4 py-3 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); setCharCount(e.target.value.length) }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about hair care, salons, products…"
              disabled={loading}
              maxLength={MAX_CHARS}
              rows={1}
              className="w-full border-2 border-bdr rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-rose bg-white resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            {charCount > 400 && (
              <span className={`absolute bottom-2 right-3 text-2xs ${charCount >= MAX_CHARS ? 'text-rose font-bold' : 'text-ink-3'}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading || charCount > MAX_CHARS}
            className="btn btn-primary flex-shrink-0 h-12 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"/>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
        <p className="text-2xs text-ink-3 text-center mt-2">
          Press Enter to send · Shift+Enter for new line · Glow AI can make mistakes — always verify important advice
        </p>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
