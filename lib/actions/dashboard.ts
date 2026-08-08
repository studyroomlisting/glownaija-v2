// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { isValidEmail, isValidPhone, isValidUKPhone, isValidUKPostcode, isValidBusinessName, normalizeSocialUrl, normalizeWhatsApp } from '@/lib/utils'

// Every action below verifies ownership against the SPECIFIC salon_id passed in,
// not just "the salon this owner has" — a single owner can now have multiple
// salons, so `.eq('owner_id', user.id).single()` would be ambiguous/wrong.
async function getOwnedSalon(supabase: any, userId: string, salonId: string) {
  if (!salonId) return null
  const { data: salon } = await supabase.from('salons').select('id').eq('id', salonId).eq('owner_id', userId).single()
  return salon
}

export async function toggleSalonPublished(salonId: string, publish: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  try {
    const salon = await getOwnedSalon(supabase, user.id, salonId)
    if (!salon) return { error: 'Salon not found, or you do not have access to it.' }

    // Only an approved listing can be published/unpublished this way — a pending or
    // suspended salon's visibility is an admin-moderation decision, not something
    // an owner should be able to override via this toggle.
    const { data: fullSalon } = await supabase.from('salons').select('listing_status').eq('id', salonId).single()
    if (fullSalon?.listing_status !== 'approved') {
      return { error: 'This listing needs admin approval before it can be published.' }
    }

    const { error } = await supabase.from('salons').update({ is_active: publish }).eq('id', salonId)
    if (error) return { error: `Could not update listing: ${error.message}` }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong.' }
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  try {
    const salonId = formData.get('salon_id') as string
    const salon = await getOwnedSalon(supabase, user.id, salonId)
    if (!salon) return { error: 'Salon not found, or you do not have access to it.' }

    const name      = (formData.get('name')        as string).trim()
    const area      = (formData.get('area')        as string).trim()
    const address   = (formData.get('address')     as string || '').trim()
    const city      = formData.get('city')         as string
    const desc      = (formData.get('description') as string || '').trim()
    const phone     = (formData.get('phone')       as string || '').trim()
    const email     = (formData.get('email')       as string || '').trim()
    const instagram = (formData.get('instagram')   as string || '').trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '').replace(/\/+$/, '')
    const website   = (formData.get('website')     as string || '').trim()
    const postcode  = (formData.get('postcode')    as string || '').trim().toUpperCase()

    const facebookIn = (formData.get('facebook') as string || '')
    const twitterIn  = (formData.get('twitter')  as string || '')
    const youtubeIn  = (formData.get('youtube')  as string || '')
    const linkedinIn = (formData.get('linkedin') as string || '')
    const whatsappIn = (formData.get('whatsapp') as string || '')
    const googleBizIn= (formData.get('google_business') as string || '')

    const facebookR  = normalizeSocialUrl(facebookIn, 'facebook')
    const twitterR   = normalizeSocialUrl(twitterIn, 'twitter')
    const youtubeR   = normalizeSocialUrl(youtubeIn, 'youtube')
    const linkedinR  = normalizeSocialUrl(linkedinIn, 'linkedin')
    const googleBizR = normalizeSocialUrl(googleBizIn, 'google_business')
    const whatsappR  = normalizeWhatsApp(whatsappIn)

    for (const r of [facebookR, twitterR, youtubeR, linkedinR, googleBizR, whatsappR]) {
      if (r.error) return { error: r.error }
    }
    const is_open   = formData.get('is_open') === 'on'
    const online_bk = formData.get('accepts_online_bookings') === 'on'
    const tagsRaw   = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)

    if (!name || name.length < 2) return { error: 'Salon name is required (min 2 characters).' }
    if (name.length > 80)         return { error: 'Salon name must be under 80 characters.' }
    if (!isValidBusinessName(name)) return { error: 'Salon name should only contain letters (no numbers or symbols).' }
    if (!area)                    return { error: 'Area is required.' }
    if (area.length > 100)        return { error: 'Area must be under 100 characters.' }
    if (!address)                 return { error: 'Street address is required.' }
    if (address.length > 200)     return { error: 'Address must be under 200 characters.' }
    if (desc.length > 1500)       return { error: 'Description must be under 1500 characters.' }
    if (!phone)                   return { error: 'Phone number is required.' }
    if (!isValidUKPhone(phone))   return { error: 'Please enter a valid UK phone number, e.g. 07700 900000 or 020 7946 0958.' }
    if (email && !isValidEmail(email))         return { error: 'Please enter a valid email address.' }
    if (!postcode)                 return { error: 'Postcode is required.' }
    if (!isValidUKPostcode(postcode)) return { error: 'Please enter a valid UK postcode, e.g. SE15 5DT.' }
    if (website && !/^https?:\/\/.+\..+/.test(website)) return { error: 'Website must be a full URL, e.g. https://yoursalon.co.uk' }
    if (instagram && !/^[a-zA-Z0-9._]{1,60}$/.test(instagram)) return { error: 'Instagram handle looks invalid — paste just your username or profile link.' }

    const { error } = await supabase.from('salons').update({
      name, area, address: address || null, city, description: desc || null,
      phone: phone || null, email: email || null,
      instagram: instagram || null, website: website || null,
      facebook: facebookR.url, twitter: twitterR.url, youtube: youtubeR.url,
      linkedin: linkedinR.url, whatsapp: whatsappR.url, google_business: googleBizR.url,
      postcode: postcode || null, is_open, accepts_online_bookings: online_bk, tags: tagsRaw,
    }).eq('id', salon.id)

    if (error) return { error: `Could not save profile: ${error.message}` }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong saving your profile. Please try again.' }
  }
}

export async function addService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  try {
    const salonId = formData.get('salon_id') as string
    const salon = await getOwnedSalon(supabase, user.id, salonId)
    if (!salon) return { error: 'Salon not found, or you do not have access to it.' }

    const name       = (formData.get('svc_name')  as string || '').trim()
    const priceInput = (formData.get('svc_price') as string || '').trim()
    const priceValue = parseFloat(priceInput)

    if (!name || name.length < 2)              return { error: 'Service name is required (min 2 characters).' }
    if (name.length > 80)                      return { error: 'Service name must be under 80 characters.' }
    if (!priceInput || isNaN(priceValue) || priceValue <= 0) return { error: 'Please enter a valid price greater than £0.' }
    if (priceValue > 9999)                     return { error: 'Price seems too high — please check and try again.' }

    const { data: dup } = await supabase.from('services').select('id').eq('salon_id', salon.id).ilike('name', name).eq('is_active', true).limit(1).single()
    if (dup) return { error: `You already have a service called "${name}". Edit the existing one instead of adding a duplicate.` }

    const { count } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('salon_id', salon.id)

    const { error } = await supabase.from('services').insert({
      salon_id: salon.id, name,
      description: (formData.get('svc_desc') as string || '').trim() || null,
      emoji:    (formData.get('svc_emoji')    as string) || '✂️',
      price:    Math.round(priceValue * 100),
      duration_minutes: parseInt(formData.get('svc_duration') as string || '60'),
      category: (formData.get('svc_category') as string) || 'natural',
      sort_order: (count || 0) + 1,
    })

    if (error) return { error: `Could not add service: ${error.message}` }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong adding the service. Please try again.' }
  }
}

export async function deleteService(serviceId: string, salonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  try {
    const salon = await getOwnedSalon(supabase, user.id, salonId)
    if (!salon) return { error: 'Not authorised' }

    const { error } = await supabase.from('services').update({ is_active: false }).eq('id', serviceId).eq('salon_id', salon.id)
    if (error) return { error: `Could not remove service: ${error.message}` }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong removing the service.' }
  }
}

export async function updateHours(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  try {
    const salonId = formData.get('salon_id') as string
    const salon = await getOwnedSalon(supabase, user.id, salonId)
    if (!salon) return { error: 'Salon not found, or you do not have access to it.' }

    for (let d = 0; d < 7; d++) {
      const closed = formData.get(`closed[${d}]`) === 'on'
      const open   = formData.get(`open[${d}]`)   as string
      const close  = formData.get(`close[${d}]`)  as string

      if (!closed && open && close && open >= close) return { error: `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]}: close time must be after open time.` }

      const { data: existing } = await supabase.from('salon_opening_hours').select('id').eq('salon_id', salon.id).eq('day_of_week', d).single()
      if (existing) {
        const { error } = await supabase.from('salon_opening_hours').update({ is_closed: closed, open_time: closed ? null : open, close_time: closed ? null : close }).eq('id', existing.id)
        if (error) return { error: `Could not save hours: ${error.message}` }
      } else {
        const { error } = await supabase.from('salon_opening_hours').insert({ salon_id: salon.id, day_of_week: d, is_closed: closed, open_time: closed ? null : open, close_time: closed ? null : close })
        if (error) return { error: `Could not save hours: ${error.message}` }
      }
    }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong saving your hours. Please try again.' }
  }
}

export async function updateEnquiryStatus(enquiryId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  try {
    const allowed = ['read','replied','archived']
    if (!allowed.includes(status)) return { error: 'Invalid status' }

    // Verify this enquiry belongs to a salon this user actually owns before allowing the update.
    const { data: enquiry } = await supabase.from('enquiries').select('id,salon_id').eq('id', enquiryId).single()
    if (!enquiry) return { error: 'Enquiry not found.' }
    const salon = await getOwnedSalon(supabase, user.id, enquiry.salon_id)
    if (!salon) return { error: 'Not authorised' }

    const { error } = await supabase.from('enquiries').update({ status }).eq('id', enquiryId)
    if (error) return { error: `Could not update enquiry: ${error.message}` }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong updating the enquiry.' }
  }
}
