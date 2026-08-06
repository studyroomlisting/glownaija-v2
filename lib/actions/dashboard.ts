// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return { error: 'No salon found.' }

  const name      = (formData.get('name')        as string).trim()
  const area      = (formData.get('area')        as string).trim()
  const city      = formData.get('city')         as string
  const desc      = (formData.get('description') as string || '').trim()
  const phone     = (formData.get('phone')       as string || '').trim()
  const email     = (formData.get('email')       as string || '').trim()
  const instagram = (formData.get('instagram')   as string || '').trim().replace(/^@/, '')
  const website   = (formData.get('website')     as string || '').trim()
  const postcode  = (formData.get('postcode')    as string || '').trim().toUpperCase()
  const is_open   = formData.get('is_open') === 'on'
  const online_bk = formData.get('accepts_online_bookings') === 'on'
  const tagsRaw   = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)

  if (!name || name.length < 2) return { error: 'Salon name is required.' }
  if (!area) return { error: 'Area is required.' }

  await supabase.from('salons').update({
    name, area, city, description: desc || null,
    phone: phone || null, email: email || null,
    instagram: instagram || null, website: website || null,
    postcode: postcode || null, is_open, accepts_online_bookings: online_bk, tags: tagsRaw,
  }).eq('id', salon.id)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function addService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return { error: 'No salon found.' }

  const name  = (formData.get('svc_name')  as string).trim()
  const price = parseInt((formData.get('svc_price') as string || '0').replace('.', ''))

  if (!name || name.length < 2) return { error: 'Service name is required.' }
  if (!price || price <= 0)      return { error: 'Please enter a valid price.' }

  const { count } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('salon_id', salon.id)

  await supabase.from('services').insert({
    salon_id: salon.id, name,
    description: (formData.get('svc_desc') as string || '').trim() || null,
    emoji:    (formData.get('svc_emoji')    as string) || '✂️',
    price:    Math.round(parseFloat(formData.get('svc_price') as string) * 100),
    duration_minutes: parseInt(formData.get('svc_duration') as string || '60'),
    category: (formData.get('svc_category') as string) || 'natural',
    sort_order: (count || 0) + 1,
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return { error: 'Not authorised' }

  await supabase.from('services').update({ is_active: false }).eq('id', serviceId).eq('salon_id', salon.id)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateHours(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).single()
  if (!salon) return { error: 'No salon found.' }

  for (let d = 0; d < 7; d++) {
    const closed = formData.get(`closed[${d}]`) === 'on'
    const open   = formData.get(`open[${d}]`)   as string
    const close  = formData.get(`close[${d}]`)  as string

    if (!closed && open && close && open >= close) return { error: `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]}: close time must be after open time.` }

    const { data: existing } = await supabase.from('salon_opening_hours').select('id').eq('salon_id', salon.id).eq('day_of_week', d).single()
    if (existing) {
      await supabase.from('salon_opening_hours').update({ is_closed: closed, open_time: closed ? null : open, close_time: closed ? null : close }).eq('id', existing.id)
    } else {
      await supabase.from('salon_opening_hours').insert({ salon_id: salon.id, day_of_week: d, is_closed: closed, open_time: closed ? null : open, close_time: closed ? null : close })
    }
  }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateEnquiryStatus(enquiryId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }
  const allowed = ['read','replied','archived']
  if (!allowed.includes(status)) return { error: 'Invalid status' }
  await supabase.from('enquiries').update({ status }).eq('id', enquiryId)
  revalidatePath('/dashboard')
  return { success: true }
}
