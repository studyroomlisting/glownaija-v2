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
    <div className="w-full max-w-md text-center">
      <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-white shadow-md flex items-center justify-center text-3xl mx-auto mb-6 relative">
        🔐
        <span className="absolute -top-1 -right-1 text-rose text-base">✨</span>
      </div>

      <div className="card card-body text-left">
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
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black mb-2">Forgot Password?</h1>
              <p className="text-ink-3 text-sm">No worries! Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            {error && <div className="alert-error mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">✉️</span>
                  <input name="email" type="email" className="input pl-10" placeholder="you@example.com" required autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3.5">
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>
            </form>

            <div className="flex items-center gap-3 bg-rose-50 rounded-xl p-4 mt-5">
              <span className="text-xl flex-shrink-0">🛡️</span>
              <div>
                <p className="text-sm font-bold">Secure &amp; Private</p>
                <p className="text-xs text-ink-3">We'll never share your email with anyone.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-bdr" /><span className="text-xs text-ink-3">or</span><div className="flex-1 h-px bg-bdr" />
            </div>

            <p className="text-center text-sm text-ink-3">
              Remember your password?{' '}
              <Link href="/auth/signin" className="text-rose font-bold">Sign in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
