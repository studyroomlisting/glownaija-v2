// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { isValidPhone }   from '@/lib/utils'

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const first_name = (formData.get('first_name') as string || '').trim()
  const last_name  = (formData.get('last_name')  as string || '').trim()
  const phone      = (formData.get('phone')      as string || '').trim()
  const city       = (formData.get('city')       as string || '').trim()
  const hair_type  = (formData.get('hair_type')  as string || '').trim()

  if (!first_name || first_name.length < 1) redirect('/account?tab=profile&msg=err_name')
  if (!last_name  || last_name.length  < 1) redirect('/account?tab=profile&msg=err_name')

  await supabase.from('profiles').update({
    first_name,
    last_name,
    phone:     phone     || null,
    city:      city      || null,
    hair_type: hair_type || null,
  }).eq('id', user.id)

  redirect('/account?tab=profile&msg=profile_saved')
}
