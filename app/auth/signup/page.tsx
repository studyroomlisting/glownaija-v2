'use client'
// @ts-nocheck
import Link from 'next/link'
import { useState } from 'react'
import { signUp } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [role,    setRole]    = useState<'customer'|'owner'>('customer')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [pwd,     setPwd]     = useState('')
  const [conf,    setConf]    = useState('')
  const [agreed,  setAgreed]  = useState(false)

  const strength = (() => {
    let s = 0
    if (pwd.length >= 8) s++; if (pwd.length >= 12) s++
    if (/[A-Z]/.test(pwd)) s++; if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  })()
  const strengthColors = ['','#E8607A','#E8607A','#D4AF37','#10B981','#10B981']
  const strengthLabels = ['','Weak','Fair','Good','Strong','Very strong']

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!agreed) { setError('You must agree to the Terms and Privacy Policy.'); return }
    if (pwd !== conf) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await signUp(fd)
    if (res?.error) { setError(res.error); setLoading(false) }
  }

  async function googleSignUp() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { role } },
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black mb-1">Create your account</h1>
        <p className="text-ink-3 text-sm">Free to join · No credit card needed</p>
      </div>
      <div className="card card-body">
        {error && <div className="alert-error mb-4">{error}</div>}

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['customer','owner'] as const).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`border-2 rounded-xl p-3 text-left transition-all ${role===r ? 'border-rose bg-rose-50' : 'border-bdr hover:border-rose/50'}`}>
              <div className="text-2xl mb-1">{r==='customer' ? '🛍️' : '🏪'}</div>
              <div className="text-sm font-bold">{r==='customer' ? 'Customer' : 'Salon Owner'}</div>
              <div className="text-xs text-ink-3">{r==='customer' ? 'Book salons & shop' : 'List my business'}</div>
            </button>
          ))}
        </div>

        <button onClick={googleSignUp} className="w-full flex items-center justify-center gap-3 border-2 border-bdr rounded-xl py-3 text-sm font-semibold hover:border-rose hover:bg-rose-50 transition-all mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-bdr" />
          <span className="text-xs text-ink-3 font-semibold">or register with email</span>
          <div className="flex-1 h-px bg-bdr" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input name="first_name" type="text" className="input" placeholder="Amara" required /></div>
            <div><label className="label">Last Name *</label><input name="last_name" type="text" className="input" placeholder="Okafor" required /></div>
          </div>
          <div><label className="label">Email Address *</label><input name="email" type="email" className="input" placeholder="you@example.com" required /></div>
          <div>
            <label className="label">Password * <span className="font-normal text-ink-3">(min 8 chars)</span></label>
            <input name="password" type="password" className="input" placeholder="Choose a strong password" required value={pwd} onChange={e=>setPwd(e.target.value)} />
            {pwd && (
              <div className="mt-1.5">
                <div className="h-1 bg-page-2 rounded-full overflow-hidden"><div style={{ width:`${strength*20}%`, background:strengthColors[strength] }} className="h-full rounded-full transition-all" /></div>
                <p className="text-xs mt-0.5" style={{ color:strengthColors[strength] }}>{strengthLabels[strength]}</p>
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm Password *</label>
            <input name="confirm" type="password" className="input" placeholder="Repeat your password" required value={conf} onChange={e=>setConf(e.target.value)} />
            {conf && <p className={`text-xs mt-1 ${pwd===conf?'text-gn':'text-rose'}`}>{pwd===conf?'✓ Passwords match':'✗ Passwords do not match'}</p>}
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-rose flex-shrink-0" checked={agreed} onChange={e=>setAgreed(e.target.checked)} />
            <span className="text-sm text-ink-2">
              I agree to GlowNaija's{' '}
              <Link href="/terms" target="_blank" className="text-rose font-bold">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" className="text-rose font-bold">Privacy Policy</Link>
            </span>
          </label>
          <button type="submit" disabled={loading || !agreed} className="btn btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-3 mt-4">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-rose font-bold">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
