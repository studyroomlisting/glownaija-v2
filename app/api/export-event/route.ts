// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const eventId = new URL(request.url).searchParams.get('id') || ''
  if (!eventId) return NextResponse.json({ error: 'No event id' }, { status: 400 })

  // Verify user is the organiser
  const { data: event } = await supabase.from('events').select('title,organiser_id').eq('id', eventId).single()
  if (!event || event.organiser_id !== user.id) {
    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('name,email,phone,tickets,created_at')
    .eq('event_id', eventId)
    .order('created_at')

  // Build CSV
  const header = 'Name,Email,Phone,Tickets,Registered At'
  const rows = (registrations || []).map(r =>
    `"${r.name}","${r.email}","${r.phone || ''}",${r.tickets},"${new Date(r.created_at).toLocaleString('en-GB')}"`
  )
  const csv = [header, ...rows].join('\n')

  const filename = `${event.title.replace(/[^a-z0-9]/gi,'_')}_registrations.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
