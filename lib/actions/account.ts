// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { isValidPhone, isValidName } from '@/lib/utils'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const first_name = (formData.get('first_name') as string || '').trim()
  const last_name  = (formData.get('last_name')  as string || '').trim()
  const phone      = (formData.get('phone')      as string || '').trim()
  const city       = (formData.get('city')       as string || '').trim()
  const hair_type  = (formData.get('hair_type')  as string || '').trim()

  if (!isValidName(first_name)) return { error: 'First name should only contain letters.' }
  if (!isValidName(last_name))  return { error: 'Last name should only contain letters.' }
  if (phone && !isValidPhone(phone)) return { error: 'Please enter a valid phone number.' }

  const { error } = await supabase.from('profiles').update({
    first_name,
    last_name,
    phone:     phone     || null,
    city:      city      || null,
    hair_type: hair_type || null,
  }).eq('id', user.id)

  if (error) return { error: `Could not save profile: ${error.message}` }

  revalidatePath('/account')
  return { success: true }
}
