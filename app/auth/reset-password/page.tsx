'use client'
// @ts-nocheck
import { useState } from 'react'
import { updatePassword } from '@/lib/actions/auth'

export default function ResetPasswordPage() {
  const [pwd,    setPwd]    = useState('')
  const [conf,   setConf]   = useState('')
  const [error,  setError]  = useState('')
  const [loading,setLoading]= useState(false)
  const [done,   setDone]   = useState(false)

  const strength = (() => {
    let s = 0
    if (pwd.length>=8) s++; if (pwd.length>=12) s++
    if (/[A-Z]/.test(pwd)) s++; if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  })()
  const cols = ['','#E8607A','#E8607A','#D4AF37','#10B981','#10B981']
  const lbls = ['','Weak','Fair','Good','Strong','Very strong']

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pwd !== conf) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await updatePassword(fd)
    if (res?.error) { setError(res.error); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="w-full max-w-md">
      <div className="card card-body text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-black text-2xl mb-2">Password changed!</h2>
        <p className="text-ink-3 text-sm mb-6">You're now signed in with your new password.</p>
        <a href="/" className="btn btn-primary w-full justify-center">Go to Homepage →</a>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black mb-1">Choose a New Password</h1>
        <p className="text-ink-3 text-sm">Pick something strong and memorable</p>
      </div>
      <div className="card card-body">
        {error && <div className="alert-error mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input name="password" type="password" className="input" placeholder="Min 8 characters" required value={pwd} onChange={e=>setPwd(e.target.value)} autoFocus />
            {pwd && (<div className="mt-1.5"><div className="h-1 bg-page-2 rounded-full overflow-hidden"><div style={{width:`${strength*20}%`,background:cols[strength]}} className="h-full rounded-full transition-all"/></div><p className="text-xs mt-0.5" style={{color:cols[strength]}}>{lbls[strength]}</p></div>)}
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input name="confirm_password" type="password" className="input" placeholder="Repeat password" required value={conf} onChange={e=>setConf(e.target.value)} />
            {conf && <p className={`text-xs mt-1 ${pwd===conf?'text-gn':'text-rose'}`}>{pwd===conf?'✓ Match':'✗ No match'}</p>}
          </div>
          <button type="submit" disabled={loading||pwd.length<8} className="btn btn-primary w-full justify-center disabled:opacity-50">
            {loading?'Changing…':'Change Password →'}
          </button>
        </form>
      </div>
    </div>
  )
}
