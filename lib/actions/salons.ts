// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { slugify, generateRef, isValidEmail, isValidPhone, isValidUKPostcode, isValidName } from '@/lib/utils'

export async function createSalon(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const name     = (formData.get('business_name') as string).trim()
  const btype    = formData.get('business_type')  as string
  const city     = formData.get('city')           as string
  const area     = (formData.get('area')          as string).trim()
  const email    = (formData.get('email')         as string).trim().toLowerCase()
  const desc     = (formData.get('description')   as string || '').trim()
  const phone    = (formData.get('phone')         as string || '').trim()
  const postcode = (formData.get('postcode')       as string || '').trim().toUpperCase()
  const instagram= (formData.get('instagram')     as string || '').trim().replace(/^@/, '')
  const website  = (formData.get('website')       as string || '').trim()
  const plan     = (formData.get('plan')          as string) || 'growth'
  const years    = parseInt(formData.get('years_active') as string || '0')
  const onlineBk = formData.get('accepts_online_bookings') === 'on'

  // Validation
  if (!name || name.length < 2) return { error: 'Business name is required.' }
  if (!city) return { error: 'City is required.' }
  if (!area) return { error: 'Area is required.' }
  if (!isValidEmail(email)) return { error: 'Please enter a valid contact email.' }
  if (phone && !isValidPhone(phone)) return { error: 'Please enter a valid phone number.' }
  if (postcode && !isValidUKPostcode(postcode)) return { error: 'Please enter a valid UK postcode.' }
  if (website && !/^https?:\/\/.+\..+/.test(website)) return { error: 'Website must be a full URL, e.g. https://yoursalon.co.uk' }
  if (instagram && !/^[a-zA-Z0-9._]{1,60}$/.test(instagram)) return { error: 'Instagram handle looks invalid.' }

  // Check duplicate
  const { data: existing } = await supabase
    .from('salons')
    .select('id')
    .ilike('name', name)
    .eq('city', city)
    .eq('is_active', true)
    .single()
  if (existing) return { error: `A salon called "${name}" already exists in ${city}.` }

  // Generate unique slug
  let slug = slugify(name)
  const { data: slugCheck } = await supabase.from('salons').select('id').eq('slug', slug).single()
  if (slugCheck) slug = slug + '-' + Math.random().toString(36).substring(2, 6)

  const TYPE_CONFIG: Record<string, [string, string[]]> = {
    'Hair Salon':         ['✂️', ['braids','natural','colour']],
    'Locs Specialist':    ['🌿', ['locs']],
    'Wig Studio':         ['👑', ['wigs']],
    'Nail Bar':           ['💅', ['nails']],
    'Makeup Artist':      ['💄', ['makeup']],
    'Skincare Studio':    ['🧴', ['skincare']],
    'Mobile Stylist':     ['💆', ['braids','natural']],
    'Beauty Spa':         ['🌸', ['skincare','makeup']],
    'Barbershop':         ['💈', ['colour']],
    'Afro Barber':        ['💈', ['colour','natural']],
    'Threading & Waxing': ['🧖', ['skincare']],
    'Eyebrow Studio':     ['🪮', ['makeup']],
    'Eyelash Studio':     ['👁️', ['makeup']],
    'Bridal Studio':      ['💍', ['makeup','wigs']],
    'Other':              ['💇', ['natural']],
  }
  const [emoji, service_types] = TYPE_CONFIG[btype] || ['💇', ['natural']]

  const { data: salon, error } = await supabase.from('salons').insert({
    owner_id: user.id, name, slug, description: desc, emoji,
    address: (formData.get('address') as string || '').trim() || null,
    area, city, postcode: postcode || null,
    phone: phone || null, email: email || null,
    instagram: instagram || null, website: website || null,
    service_types, plan, listing_status: 'pending',
    is_active: false, is_open: true,
    years_active: years, accepts_online_bookings: onlineBk,
  }).select().single()

  if (error || !salon) return { error: error?.message ? `Could not create salon: ${error.message}` : 'Could not create salon. Please try again.' }

  // Whoever successfully lists a salon should be recognized as an owner from here on,
  // regardless of what account_type they originally signed up with.
  await supabase.from('profiles').update({ account_type: 'owner' }).eq('id', user.id)

  // Notify admins
  const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
  if (admins?.length) {
    await supabase.from('notifications').insert(
      admins.map(a => ({
        user_id: a.id,
        type: 'new_salon',
        title: '🏪 New salon listed',
        body: `${name} (${btype}) just went live in ${city}.`,
        link: '/admin',
      }))
    )
  }

  // Welcome notification to owner
  await supabase.from('notifications').insert({
    user_id: user.id, type: 'salon_live',
    title: '🎉 Your salon is live!',
    body: `${name} is now listed on GlowNaija. Complete your profile to attract more clients.`,
    link: '/dashboard',
  })

  // Salon live email to owner
  try {
    const { sendSalonLiveEmail } = await import('@/lib/email')
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    await sendSalonLiveEmail({ email: user.email!, firstName: prof?.first_name || 'there', salonName: name, salonSlug: slug, city })
  } catch {}

  redirect(`/dashboard?welcome=1&salon=${salon.id}`)
}

export async function saveSalon(salonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: existing } = await supabase.from('saved_salons')
    .select('id').eq('user_id', user.id).eq('salon_id', salonId).single()

  if (existing) {
    await supabase.from('saved_salons').delete().eq('id', existing.id)
    return { saved: false }
  } else {
    await supabase.from('saved_salons').insert({ user_id: user.id, salon_id: salonId })
    return { saved: true }
  }
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to leave a review.' }

  const salon_id   = formData.get('salon_id')    as string
  const rating     = parseInt(formData.get('rating') as string)
  const review_text = (formData.get('review_text') as string).trim()

  if (rating < 1 || rating > 5)   return { error: 'Please select a star rating.' }
  if (review_text.length < 10)    return { error: 'Review must be at least 10 characters.' }

  const { data: exists } = await supabase.from('reviews')
    .select('id').eq('reviewer_id', user.id).eq('salon_id', salon_id).single()
  if (exists) return { error: 'You have already reviewed this salon.' }

  // "Verified" should mean what it implies to other customers: this reviewer
  // actually completed a booking at this salon. Previously every review was
  // marked verified regardless, which let anyone post a misleadingly-badged review.
  const { data: completedBooking } = await supabase.from('bookings')
    .select('id').eq('customer_id', user.id).eq('salon_id', salon_id).eq('status', 'completed').limit(1).single()

  const { error } = await supabase.from('reviews').insert({
    reviewer_id: user.id, salon_id, rating, review_text,
    service_booked: (formData.get('service_booked') as string) || null,
    hair_type: (formData.get('hair_type') as string) || null,
    is_verified: !!completedBooking,
  })

  if (error) return { error: 'Could not submit review. Please try again.' }
  revalidatePath(`/salons/${formData.get('slug')}`)
  return { success: true }
}

export async function submitEnquiry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const salon_id = formData.get('salon_id') as string
  const name     = (formData.get('enq_name')    as string).trim()
  const email    = (formData.get('enq_email')   as string).trim().toLowerCase()
  const phone    = (formData.get('enq_phone')   as string || '').trim()
  const subject  = (formData.get('enq_subject') as string || 'General Enquiry').trim()
  const message  = (formData.get('enq_message') as string).trim()

  if (!isValidName(name))    return { error: 'Please enter your full name (letters only).' }
  if (!isValidEmail(email))  return { error: 'Please enter a valid email address.' }
  if (phone && !isValidPhone(phone)) return { error: 'Please enter a valid phone number.' }
  if (message.length < 10)   return { error: 'Message must be at least 10 characters.' }

  const { error } = await supabase.from('enquiries').insert({
    salon_id, sender_id: user?.id || null,
    name, email,
    phone: phone || null,
    subject,
    message,
  })

  if (error) return { error: 'Could not send enquiry.' }

  // Notify salon owner (in-app + email)
  const { data: salon } = await supabase.from('salons').select('owner_id,name,email').eq('id', salon_id).single()
  if (salon) {
    await supabase.from('notifications').insert({
      user_id: salon.owner_id, type: 'new_enquiry',
      title: '📩 New Enquiry',
      body: `${name} sent an enquiry to ${salon.name}.`,
      link: '/dashboard?tab=enquiries',
    })
    // Email notification
    try {
      const { sendEnquiryNotification } = await import('@/lib/email')
      const adminClient = await import('@/lib/supabase/server').then(m => m.createAdminClient())
      const ownerUser = await (await adminClient).auth.admin.getUserById(salon.owner_id)
      const ownerEmail = ownerUser.data.user?.email || salon.email
      if (ownerEmail) {
        await sendEnquiryNotification({
          ownerEmail, salonName: salon.name, senderName: name,
          senderEmail: email, senderPhone: phone || undefined,
          subject, message,
        })
      }
    } catch {}
  }

  return { success: true }
}
