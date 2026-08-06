// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Lazy imports to avoid build-time execution
  const { createAdminClient } = await import('@/lib/supabase/server')
  const {
    sendBookingReminder,
    sendBookingStatusUpdate,
    sendEventReminder,
  } = await import('@/lib/email')

  const supabase = await createAdminClient()

  const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const tomorrowStr  = tomorrow.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // 1. 24h booking reminders
  const { data: reminders } = await supabase
    .from('bookings')
    .select('*,salons(name,address,area,city,phone),services(name),profiles(first_name)')
    .eq('booking_date', tomorrowStr)
    .in('status', ['confirmed', 'pending'])

  let remindersSent = 0
  for (const b of (reminders || [])) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(b.customer_id)
      if (!user?.email) continue
      await sendBookingReminder({
        email:       user.email,
        firstName:   b.profiles?.first_name || 'there',
        salonName:   b.salons?.name || '',
        salonAddress:b.salons?.address ? `${b.salons.address}, ${b.salons.area}, ${b.salons.city}` : undefined,
        salonPhone:  b.salons?.phone,
        serviceName: b.services?.name || 'Appointment',
        date:        b.booking_date,
        timeSlot:    b.time_slot,
        reference:   b.reference,
      })
      remindersSent++
    } catch {}
  }

  // 2. Mark no-shows
  const { data: noShows } = await supabase
    .from('bookings')
    .select('*,profiles(first_name)')
    .eq('booking_date', yesterdayStr)
    .in('status', ['pending', 'confirmed'])

  let noShowsMarked = 0
  for (const b of (noShows || [])) {
    await supabase.from('bookings').update({ status: 'no_show' }).eq('id', b.id)
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(b.customer_id)
      if (user?.email) {
        await sendBookingStatusUpdate({
          email: user.email, firstName: b.profiles?.first_name || 'there',
          salonName: '', reference: b.reference,
          date: b.booking_date, timeSlot: b.time_slot, status: 'no_show',
        })
      }
    } catch {}
    noShowsMarked++
  }

  // 3. Event reminders
  const { data: events } = await supabase
    .from('events').select('*').eq('event_date', tomorrowStr).eq('is_active', true)

  let eventRemindersSent = 0
  for (const ev of (events || [])) {
    const { data: regs } = await supabase.from('event_registrations')
      .select('name,email,tickets').eq('event_id', ev.id)
    for (const reg of (regs || [])) {
      try {
        await sendEventReminder({
          email: reg.email, name: reg.name,
          eventTitle: ev.title, eventEmoji: ev.emoji,
          eventDate: ev.event_date, timeStart: ev.time_start,
          venue: ev.venue, city: ev.city, eventId: ev.id, tickets: reg.tickets,
        })
        eventRemindersSent++
      } catch {}
    }
  }

  return NextResponse.json({
    ok: true,
    reminders_sent: remindersSent,
    no_shows_marked: noShowsMarked,
    event_reminders_sent: eventRemindersSent,
    run_at: new Date().toISOString(),
  })
}
