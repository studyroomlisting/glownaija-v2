// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { generateRef, ukDateString, ukTimeString } from '@/lib/utils'

export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/booking')

  const salon_id    = formData.get('salon_id')    as string
  const service_id  = formData.get('service_id')  as string
  const date        = formData.get('date')         as string
  const time_slot   = formData.get('time_slot')    as string
  const notes       = (formData.get('notes') as string || '').trim()

  if (!salon_id || !date || !time_slot) return { error: 'Missing required fields.' }
  if (date < ukDateString()) return { error: 'Date must be today or later.' }

  if (date === ukDateString()) {
    const nowTime = ukTimeString()
    if (time_slot <= nowTime) return { error: 'That time has already passed. Please choose a later slot.' }
  }

  // Fast-path check — good UX for the common case, but NOT the real protection
  // (see the unique index added in migration 012 for why this alone isn't enough).
  const { data: taken } = await supabase.from('bookings')
    .select('id')
    .eq('salon_id', salon_id)
    .eq('booking_date', date)
    .eq('time_slot', time_slot)
    .in('status', ['pending','confirmed'])
    .single()

  if (taken) return { error: 'This slot was just taken. Please choose another time.' }

  // Get service price for deposit (25%)
  const { data: service } = await supabase.from('services')
    .select('price').eq('id', service_id).single()
  const deposit = service ? Math.round(service.price * 0.25) : 0
  // Stripe won't create a checkout session for a £0 line item, and there's nothing
  // to actually collect — so a booking with no deposit due is confirmed immediately
  // rather than left 'pending' waiting on a payment step that can't happen.
  const noDepositDue = deposit <= 0

  const reference = generateRef('GNB')

  const { data: booking, error } = await supabase.from('bookings').insert({
    salon_id, customer_id: user.id,
    service_id: service_id || null,
    booking_date: date, time_slot,
    status: noDepositDue ? 'confirmed' : 'pending', reference,
    deposit_amount: deposit, deposit_paid: noDepositDue,
    notes: notes || null,
  }).select().single()

  if (error) {
    // Postgres 23505 = unique_violation. This is the database's slot-uniqueness
    // constraint doing its job — a concurrent request won the race between our
    // check above and this insert. Same friendly message as the fast-path check.
    if (error.code === '23505') return { error: 'This slot was just taken. Please choose another time.' }
    return { error: 'Could not create booking. Please try again.' }
  }
  if (!booking) return { error: 'Could not create booking. Please try again.' }

  // Notify salon owner
  const { data: salon } = await supabase.from('salons').select('owner_id,name').eq('id', salon_id).single()
  if (salon) {
    await supabase.from('notifications').insert({
      user_id: salon.owner_id, type: 'new_booking',
      title: '📅 New Booking',
      body: `New booking for ${date} at ${time_slot} — Ref: ${reference}`,
      link: '/dashboard?tab=bookings',
    })
  }

  // Booking confirmation email to customer
  try {
    const { sendBookingConfirmation, sendNewBookingAlert } = await import('@/lib/email')
    const { createAdminClient } = await import('@/lib/supabase/server')
    const { notifyAdmins } = await import('@/lib/notify-admins')
    const adminClient = await createAdminClient()
    const { data: prof  } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    const { data: svc   } = service_id ? await supabase.from('services').select('name').eq('id', service_id).single() : { data: null }
    const { data: salon2} = await supabase.from('salons').select('name,slug,email,owner_id').eq('id', salon_id).single()

    if (salon2) {
      await sendBookingConfirmation({
        email: user.email!, firstName: prof?.first_name || 'there',
        reference, salonName: salon2.name, salonSlug: salon2.slug,
        serviceName: svc?.name || 'Appointment',
        date, timeSlot: time_slot, depositAmount: deposit, depositPaid: false,
      })

      // Alert to salon owner — was using the wrong (non-admin) client, so this
      // email always failed silently; the in-app notification above still worked.
      const ownerUser = await adminClient.auth.admin.getUserById(salon2.owner_id)
      const ownerEmail = ownerUser.data.user?.email || salon2.email
      const customerName = `${prof?.first_name || ''} ${user.email!.split('@')[0]}`.trim()
      if (ownerEmail) {
        await sendNewBookingAlert({
          ownerEmail, salonName: salon2.name,
          customerName,
          serviceName: svc?.name || 'Appointment',
          date, timeSlot: time_slot, reference, depositPaid: false, depositAmount: deposit,
        })
      }

      // Admins weren't notified of new bookings at all before this.
      await notifyAdmins(supabase, {
        type: 'new_booking',
        title: '📅 New Booking',
        body: `${customerName} booked ${svc?.name || 'an appointment'} at ${salon2.name} for ${date} ${time_slot}. Ref: ${reference}.`,
        link: '/admin?tab=bookings',
      })
    }
  } catch {}

  redirect(`/booking/confirmation?ref=${reference}`)
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: booking } = await supabase.from('bookings')
    .select('*,salons(name,owner_id,email),services(name),profiles(first_name)')
    .eq('id', bookingId).eq('customer_id', user.id).single()
  if (!booking || !['pending', 'confirmed'].includes(booking.status)) {
    return { error: 'Could not cancel booking.' }
  }

  const { error } = await supabase.from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .in('status', ['pending', 'confirmed'])

  if (error) return { error: 'Could not cancel booking.' }

  // Notify owner + admin, and confirm the cancellation to the customer — this
  // previously sent nothing to anyone (no email, no in-app notification at all).
  try {
    const salon = booking.salons as any
    const customerName = `${(booking.profiles as any)?.first_name || ''} ${user.email!.split('@')[0]}`.trim()

    if (salon?.owner_id) {
      await supabase.from('notifications').insert({
        user_id: salon.owner_id, type: 'booking_cancelled',
        title: '❌ Booking Cancelled',
        body: `${customerName} cancelled their booking for ${booking.booking_date} ${booking.time_slot}. Ref: ${booking.reference}.`,
        link: '/dashboard?tab=bookings',
      })
    }

    const { sendBookingStatusUpdate, sendAdminAlert } = await import('@/lib/email')
    const { createAdminClient } = await import('@/lib/supabase/server')
    const { notifyAdmins } = await import('@/lib/notify-admins')
    const adminClient = await createAdminClient()

    // Customer — confirms the cancellation went through.
    await sendBookingStatusUpdate({
      email: user.email!, firstName: (booking.profiles as any)?.first_name || 'there',
      salonName: salon?.name || '', reference: booking.reference,
      date: booking.booking_date, timeSlot: booking.time_slot, status: 'cancelled',
    })

    // Owner
    if (salon?.owner_id) {
      const ownerUser = await adminClient.auth.admin.getUserById(salon.owner_id)
      const ownerEmail = ownerUser.data.user?.email || salon.email
      if (ownerEmail) {
        await sendAdminAlert({
          adminEmail: ownerEmail,
          title: '❌ Booking Cancelled',
          message: `${customerName} cancelled their booking at ${salon.name} for ${booking.booking_date} ${booking.time_slot}. Reference: ${booking.reference}.`,
          link: '/dashboard?tab=bookings',
        })
      }
    }

    // Admin
    await notifyAdmins(supabase, {
      type: 'booking_cancelled',
      title: '❌ Booking Cancelled',
      body: `${customerName} cancelled their booking at ${salon?.name || 'a salon'} for ${booking.booking_date} ${booking.time_slot}. Ref: ${booking.reference}.`,
      link: '/admin?tab=bookings',
    })
  } catch { /* non-fatal — the cancellation itself already succeeded above */ }

  revalidatePath('/account')
  return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  try {
    const allowed = ['confirmed','completed','cancelled','no_show']
    if (!allowed.includes(status)) return { error: 'Invalid status' }

    // Verify user owns the salon this booking belongs to
    const { data: booking } = await supabase.from('bookings')
      .select('*,salons(name,owner_id),services(name),profiles(first_name)')
      .eq('id', bookingId).single()
    if (!booking) return { error: 'Booking not found' }

    const salon = booking.salons as any
    if (!salon || salon.owner_id !== user.id) return { error: 'Not authorised' }

    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
    if (error) return { error: `Could not update booking: ${error.message}` }

    // Tell the customer their booking's status actually changed — this used to
    // send nothing at all, so a customer only found out by checking the site.
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminClient = await createAdminClient()
      const customerAuth = await adminClient.auth.admin.getUserById(booking.customer_id)
      const customerEmail = customerAuth.data.user?.email
      if (customerEmail && ['confirmed', 'cancelled', 'no_show'].includes(status)) {
        const { sendBookingStatusUpdate } = await import('@/lib/email')
        await sendBookingStatusUpdate({
          email: customerEmail, firstName: (booking.profiles as any)?.first_name || 'there',
          salonName: salon.name, reference: booking.reference,
          date: booking.booking_date, timeSlot: booking.time_slot,
          status: status as 'confirmed' | 'cancelled' | 'no_show',
        })
      }

      // Admins care most about cancellations specifically (pattern of a salon
      // cancelling a lot of bookings is worth them seeing) — not every routine
      // confirm/complete, which would just be noise.
      if (status === 'cancelled') {
        const { notifyAdmins } = await import('@/lib/notify-admins')
        await notifyAdmins(supabase, {
          type: 'booking_cancelled',
          title: '❌ Booking Cancelled by Salon',
          body: `${salon.name} cancelled a booking for ${booking.booking_date} ${booking.time_slot}. Ref: ${booking.reference}.`,
          link: '/admin?tab=bookings',
        })
      }
    } catch { /* non-fatal — the status update itself already succeeded above */ }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Something went wrong updating the booking.' }
  }
}
