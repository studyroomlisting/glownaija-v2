// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { generateRef }    from '@/lib/utils'

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
  if (date <= new Date().toISOString().split('T')[0]) return { error: 'Date must be in the future.' }

  // Check slot not already taken (race condition protection)
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

  const reference = generateRef('GNB')

  const { data: booking, error } = await supabase.from('bookings').insert({
    salon_id, customer_id: user.id,
    service_id: service_id || null,
    booking_date: date, time_slot,
    status: 'pending', reference,
    deposit_amount: deposit, deposit_paid: false,
    notes: notes || null,
  }).select().single()

  if (error || !booking) return { error: 'Could not create booking. Please try again.' }

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

      // Alert to salon owner
      const ownerUser = await supabase.auth.admin.getUserById(salon2.owner_id)
      const ownerEmail = ownerUser.data.user?.email || salon2.email
      if (ownerEmail) {
        await sendNewBookingAlert({
          ownerEmail, salonName: salon2.name,
          customerName: `${prof?.first_name || ''} ${user.email!.split('@')[0]}`.trim(),
          serviceName: svc?.name || 'Appointment',
          date, timeSlot: time_slot, reference, depositPaid: false, depositAmount: deposit,
        })
      }
    }
  } catch {}

  redirect(`/booking/confirmation?ref=${reference}`)
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase.from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .in('status', ['pending', 'confirmed'])

  if (error) return { error: 'Could not cancel booking.' }
  revalidatePath('/account')
  return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const allowed = ['confirmed','completed','cancelled','no_show']
  if (!allowed.includes(status)) return { error: 'Invalid status' }

  // Verify user owns the salon this booking belongs to
  const { data: booking } = await supabase.from('bookings').select('salon_id').eq('id', bookingId).single()
  if (!booking) return { error: 'Booking not found' }

  const { data: salon } = await supabase.from('salons').select('id').eq('id', booking.salon_id).eq('owner_id', user.id).single()
  if (!salon) return { error: 'Not authorised' }

  await supabase.from('bookings').update({ status }).eq('id', bookingId)
  revalidatePath('/dashboard')
  return { success: true }
}
