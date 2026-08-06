// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlots } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const salonId = searchParams.get('salon_id') || ''
  const date    = searchParams.get('date')      || ''
  const today   = new Date().toISOString().split('T')[0]

  if (!salonId || !date || date <= today)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const supabase = await createClient()

  const { data: salon } = await supabase.from('salons').select('is_open').eq('id', salonId).single()
  if (!salon?.is_open)
    return NextResponse.json({ all_slots: [], taken_slots: [], is_closed: true })

  // day_of_week 0=Sun...6=Sat
  const dow = new Date(date + 'T00:00:00').getDay()
  const { data: hours } = await supabase
    .from('salon_opening_hours')
    .select('*')
    .eq('salon_id', salonId)
    .eq('day_of_week', dow)
    .single()

  if (!hours || hours.is_closed)
    return NextResponse.json({ all_slots: [], taken_slots: [], is_closed: true })

  const all_slots  = generateSlots(hours.open_time!, hours.close_time!)
  const { data: taken } = await supabase
    .from('bookings')
    .select('time_slot')
    .eq('salon_id', salonId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed'])

  const taken_slots = taken?.map(t => t.time_slot) || []

  return NextResponse.json({
    all_slots, taken_slots, is_closed: false,
    open_time:  hours.open_time?.substring(0,5),
    close_time: hours.close_time?.substring(0,5),
    date, day: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow],
  })
}
