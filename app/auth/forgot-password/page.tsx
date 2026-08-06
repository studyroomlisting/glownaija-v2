'use client'
// @ts-nocheck
import Link from 'next/link'
import { useState } from 'react'
import { resetPassword } from '@/lib/actions/auth'

export default function ForgotPasswordPage() {
  const [sent, setSent]     = useState(false)
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [loading,setLoading]= useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    setEmail(fd.get('email') as string)
    const res = await resetPassword(fd)
    if (res?.error) { setError(res.error); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black mb-1">Forgot Password?</h1>
        <p className="text-ink-3 text-sm">We'll send a reset link to your email</p>
      </div>
      <div className="card card-body">
        {sent ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="font-black text-xl mb-2">Check your email</h2>
            <p className="text-ink-3 text-sm mb-2">If an account exists for <strong>{email}</strong>, we've sent a reset link.</p>
            <p className="text-ink-3 text-xs mb-6">Link expires in 1 hour. Check your spam folder.</p>
            <Link href="/auth/signin" className="btn btn-primary w-full justify-center">Back to Sign In →</Link>
            <button onClick={() => setSent(false)} className="text-xs text-ink-3 hover:text-rose mt-3 block mx-auto">Didn't get it? Try again</button>
          </div>
        ) : (
          <>
            {error && <div className="alert-error mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input name="email" type="email" className="input" placeholder="you@example.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>
            </form>
            <p className="text-center text-sm text-ink-3 mt-4">
              Remember it? <Link href="/auth/signin" className="text-rose font-bold">Sign in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
