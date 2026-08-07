'use client'
// @ts-nocheck
import Link from 'next/link'
import { useState } from 'react'
import { signIn } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd  = new FormData(e.currentTarget)
    const res = await signIn(fd)
    if (res?.error) { setError(res.error); setLoading(false) }
  }

  async function googleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl">

      {/* Left panel */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-rose-50 via-page to-purple-50 p-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-rose/10"/>
        <div className="absolute bottom-24 -left-10 w-40 h-40 rounded-full bg-gold/10"/>

        <span className="badge-pill bg-white text-ink text-xs font-bold w-fit mb-6 relative">Welcome back! 👋</span>
        <h1 className="text-3xl font-black leading-tight mb-3 relative">
          Sign in to your <span className="text-rose">account</span>
        </h1>
        <p className="text-ink-3 text-sm mb-8 relative">Access your bookings, favourites and exclusive beauty deals.</p>

        <div className="space-y-4 relative mb-10">
          {[
            ['✨', 'Discover top beauty services'],
            ['📅', 'Book appointments instantly'],
            ['🛡️', 'Secure & trusted platform'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-base shadow-sm flex-shrink-0">{icon}</span>
              <span className="text-sm font-semibold text-ink-2">{label}</span>
            </div>
          ))}
        </div>

        {/* Decorative visual — swap for a real lifestyle photo at public/assets/images/auth-side.jpg if you have one */}
        <div className="mt-auto relative rounded-2xl h-48 bg-gradient-to-br from-rose/20 via-white to-gold/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(circle at 30% 30%, #E8607A 0%, transparent 50%), radial-gradient(circle at 75% 70%, #D4AF37 0%, transparent 45%)'}}/>
          <span className="relative text-6xl">💄</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black mb-1">Welcome back ✨</h2>
          <p className="text-ink-3 text-sm">Sign in to continue to GlowNaija</p>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        <button onClick={googleSignIn} className="w-full flex items-center justify-center gap-3 border-2 border-bdr rounded-xl py-3 text-sm font-semibold text-ink hover:border-rose hover:bg-rose-50 transition-all mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-bdr" />
          <span className="text-xs text-ink-3 font-semibold">or sign in with email</span>
          <div className="flex-1 h-px bg-bdr" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">✉️</span>
              <input name="email" type="email" className="input pl-10" placeholder="you@example.com" required autoComplete="email" autoFocus />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-rose font-semibold hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">🔒</span>
              <input name="password" type={showPwd ? 'text' : 'password'} className="input pl-10 pr-12" placeholder="Enter your password" required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-base">
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-rose" />
            <span className="text-sm text-ink-2">Remember me</span>
          </label>
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center text-base py-3.5">
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-3 mt-4">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-rose font-bold hover:underline">Create one free →</Link>
        </p>

        <p className="text-center text-2xs text-ink-3 mt-5 flex items-center justify-center gap-1">
          <span>🛡️</span> Your data is safe and secure with us
        </p>
      </div>
    </div>
  )
}
