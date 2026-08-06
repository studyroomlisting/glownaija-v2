// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/events/create')

  const title      = (formData.get('title')       as string).trim()
  const date       = formData.get('event_date')   as string
  const time_start = formData.get('time_start')   as string
  const time_end   = formData.get('time_end')     as string
  const venue      = (formData.get('venue')       as string).trim()
  const city       = formData.get('city')         as string
  const price      = Math.round(parseFloat(formData.get('price') as string || '0') * 100)
  const is_free    = formData.get('is_free') === 'on' || price === 0
  const capacity   = parseInt(formData.get('capacity') as string || '50')
  const desc       = (formData.get('description') as string || '').trim()
  const emoji      = (formData.get('emoji')       as string) || '🎉'
  const event_type = (formData.get('event_type')  as string) || 'workshop'

  // Validation
  if (!title || title.length < 3)
    return { error: 'Title must be at least 3 characters.' }
  if (!date || date <= new Date().toISOString().split('T')[0])
    return { error: 'Event date must be in the future.' }
  if (!time_start || !time_end)
    return { error: 'Start and end times are required.' }
  if (time_end <= time_start)
    return { error: 'End time must be after start time.' }
  if (!venue)
    return { error: 'Venue is required.' }
  if (!city)
    return { error: 'City is required.' }
  if (capacity < 1 || capacity > 10000)
    return { error: 'Capacity must be between 1 and 10,000.' }

  const { data: event, error } = await supabase.from('events').insert({
    organiser_id: user.id, title, emoji, description: desc || null,
    event_type, event_date: date, time_start, time_end,
    venue, city, price, is_free, capacity, is_active: true,
  }).select().single()

  if (error || !event) return { error: 'Could not create event. Please try again.' }

  // In-app notification to all admins
  try {
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id, type: 'new_event',
          title: '🎉 New Event Created',
          body: `${title} in ${city} on ${new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}.`,
          link: '/admin?tab=events',
        }))
      )
    }
  } catch {}

  // Email all admins
  try {
    const { sendEventCreatedAlert } = await import('@/lib/email')
    const adminClient = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('first_name,last_name').eq('id', user.id).single()
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
    for (const admin of admins || []) {
      const adminUser = await adminClient.auth.admin.getUserById(admin.id)
      const adminEmail = adminUser.data.user?.email
      if (adminEmail) {
        await sendEventCreatedAlert({
          adminEmail,
          organiserName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.email!,
          organiserEmail: user.email!,
          eventTitle: title, eventDate: date, city,
          eventType: event_type, price, isFree: is_free, capacity,
          eventId: event.id,
        })
      }
    }
  } catch {}

  revalidatePath('/events')
  redirect(`/events/${event.id}?created=1`)
}

export async function registerForEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const event_id = formData.get('event_id') as string
  const name     = (formData.get('name')    as string).trim()
  const email    = (formData.get('email')   as string).trim().toLowerCase()
  const phone    = (formData.get('phone')   as string || '').trim()
  const tickets  = parseInt(formData.get('tickets') as string || '1')

  // Validation
  if (!name || name.length < 2)       return { error: 'Please enter your full name.' }
  if (!email.includes('@'))           return { error: 'Please enter a valid email address.' }
  if (tickets < 1 || tickets > 10)   return { error: 'You can register 1–10 tickets.' }

  // Check already registered
  const { data: existing } = await supabase.from('event_registrations')
    .select('id').eq('event_id', event_id).eq('email', email).single()
  if (existing) return { error: 'This email is already registered for this event.' }

  // Fetch event details
  const { data: event } = await supabase.from('events')
    .select('*,profiles(first_name,last_name)')
    .eq('id', event_id).single()
  if (!event) return { error: 'Event not found.' }

  // Check capacity
  if (event.rsvp_count + tickets > event.capacity)
    return { error: `Only ${event.capacity - event.rsvp_count} spot(s) remaining.` }

  // Insert registration
  const { error: regError } = await supabase.from('event_registrations').insert({
    event_id, user_id: user?.id || null,
    name, email, phone: phone || null, tickets,
  })
  if (regError) return { error: 'Registration failed. Please try again.' }

  // Increment rsvp_count correctly
  await supabase.from('events')
    .update({ rsvp_count: event.rsvp_count + tickets })
    .eq('id', event_id)

  // In-app notification to organiser
  try {
    await supabase.from('notifications').insert({
      user_id: event.organiser_id, type: 'new_rsvp',
      title: `🎉 New RSVP — ${event.title}`,
      body: `${name} registered ${tickets} ticket${tickets > 1 ? 's' : ''}.`,
      link: `/events/${event_id}/dashboard`,
    })
  } catch {}

  // Email 1 — confirmation to attendee
  try {
    const { sendEventRegistrationConfirmation } = await import('@/lib/email')
    await sendEventRegistrationConfirmation({
      email, name,
      eventTitle:  event.title,
      eventEmoji:  event.emoji,
      eventDate:   event.event_date,
      timeStart:   event.time_start,
      timeEnd:     event.time_end,
      venue:       event.venue,
      city:        event.city,
      tickets,
      price:       event.price,
      isFree:      event.is_free,
      eventId:     event_id,
    })
  } catch {}

  // Email 2 — alert to organiser
  try {
    const { sendNewRegistrationAlert } = await import('@/lib/email')
    const adminClient = await createAdminClient()
    const organiserUser = await adminClient.auth.admin.getUserById(event.organiser_id)
    const organiserEmail = organiserUser.data.user?.email
    if (organiserEmail) {
      await sendNewRegistrationAlert({
        organiserEmail,
        eventTitle:        event.title,
        attendeeName:      name,
        attendeeEmail:     email,
        attendeePhone:     phone || undefined,
        tickets,
        totalRegistrations: event.rsvp_count + tickets,
        capacity:          event.capacity,
        eventId:           event_id,
      })
    }
  } catch {}

  return { success: true }
}

export async function cancelEventRegistration(eventId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: reg } = await supabase.from('event_registrations')
    .select('id,tickets').eq('event_id', eventId).eq('email', email).single()
  if (!reg) return { error: 'Registration not found' }

  await supabase.from('event_registrations').delete().eq('id', reg.id)

  // Decrement rsvp_count
  const { data: event } = await supabase.from('events').select('rsvp_count').eq('id', eventId).single()
  if (event) {
    await supabase.from('events')
      .update({ rsvp_count: Math.max(0, event.rsvp_count - reg.tickets) })
      .eq('id', eventId)
  }

  revalidatePath('/events')
  return { success: true }
}
