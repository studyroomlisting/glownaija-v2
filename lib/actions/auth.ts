// @ts-nocheck
'use server'
import { revalidatePath }  from 'next/cache'
import { redirect }        from 'next/navigation'
import { createClient }    from '@/lib/supabase/server'
import { isValidEmail }    from '@/lib/utils'

export async function signUp(formData: FormData) {
  const supabase    = await createClient()
  const email       = (formData.get('email')       as string).trim().toLowerCase()
  const password    = formData.get('password')     as string
  const first_name  = (formData.get('first_name')  as string).trim()
  const last_name   = (formData.get('last_name')   as string).trim()
  const account_type = formData.get('role') === 'owner' ? 'owner' : 'customer'

  if (!first_name || !last_name) return { error: 'Name is required.' }
  if (!isValidEmail(email))       return { error: 'Invalid email address.' }
  if (password.length < 8)        return { error: 'Password must be at least 8 characters.' }

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
  const next     = (formData.get('next')    as string) || '/'

  if (!isValidEmail(email)) return { error: 'Invalid email address.' }
  if (!password)             return { error: 'Password is required.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Incorrect email or password.' }

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
  if (password !== confirmPwd) return { error: 'Passwords do not match.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect('/account?msg=password_changed')
}
