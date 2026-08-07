// @ts-nocheck
'use server'
import { revalidatePath }  from 'next/cache'
import { redirect }        from 'next/navigation'
import { cookies }         from 'next/headers'
import { createClient }    from '@/lib/supabase/server'
import { isValidEmail, isValidName } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'

export async function signUp(formData: FormData) {
  const supabase    = await createClient()
  const email       = (formData.get('email')       as string).trim().toLowerCase()
  const password    = formData.get('password')     as string
  const first_name  = (formData.get('first_name')  as string).trim()
  const last_name   = (formData.get('last_name')   as string).trim()
  const account_type = formData.get('role') === 'owner' ? 'owner' : 'customer'

  if (!first_name || !last_name) return { error: 'Name is required.' }
  if (!isValidName(first_name) || !isValidName(last_name)) return { error: 'Names should only contain letters.' }
  if (!isValidEmail(email))       return { error: 'Invalid email address.' }
  if (password.length < 8)        return { error: 'Password must be at least 8 characters.' }
  if (password.length > 72)       return { error: 'Password must be under 72 characters.' }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return { error: 'Password must contain at least one letter and one number.' }

  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { first_name, last_name, account_type },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  // Welcome email
  try {
    const { sendWelcomeEmail } = await import('@/lib/email')
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('email', email).single()
    await sendWelcomeEmail({ email, firstName: prof?.first_name || first_name, isOwner: account_type === 'owner' })
  } catch {}

  redirect(account_type === 'owner' ? '/business?welcome=1' : '/?welcome=1')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email    = (formData.get('email')    as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const rawNext  = (formData.get('next')    as string) || '/'
  // Only ever follow a same-site relative path. "//evil.com" is a protocol-relative
  // URL browsers treat as external, so it's explicitly excluded alongside absolute URLs.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (!isValidEmail(email)) return { error: 'Invalid email address.' }
  if (!password)             return { error: 'Password is required.' }

  const rl = await checkRateLimit(email, 'signin', 5, 15)
  if (!rl.allowed) return { error: rl.error }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Incorrect email or password.' }

  const remember = formData.get('remember') === 'on'
  if (!remember) {
    // Supabase's cookie handler just wrote persistent (long-lived) cookies for this
    // session. Rewriting them here with no maxAge/expires turns them into session
    // cookies — gone when the browser closes — without touching the shared cookie
    // handler in lib/supabase/server.ts that every other request relies on.
    const cookieStore = await cookies()
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
        cookieStore.set(c.name, c.value, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' })
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string).trim().toLowerCase()
  if (!isValidEmail(email)) return { error: 'Invalid email address.' }

  const rl = await checkRateLimit(email, 'reset_password', 3, 60)
  if (!rl.allowed) return { error: rl.error }

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase   = await createClient()
  const password   = formData.get('password')         as string
  const confirmPwd = formData.get('confirm_password') as string

  if (password.length < 8)   return { error: 'Password must be at least 8 characters.' }
  if (password.length > 72)  return { error: 'Password must be under 72 characters.' }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return { error: 'Password must contain at least one letter and one number.' }
  if (password !== confirmPwd) return { error: 'Passwords do not match.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  // Password just changed — any session on another device (including one an
  // attacker may have) should not remain valid. Passing this session's own access
  // token with scope='others' revokes every other session for the same user while
  // leaving the session that just made this change untouched.
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    if (accessToken) {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminClient = await createAdminClient()
      await adminClient.auth.admin.signOut(accessToken, 'others')
    }
  } catch { /* non-fatal — the password change itself already succeeded */ }

  redirect('/account?msg=password_changed')
}
