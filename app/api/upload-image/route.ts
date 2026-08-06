// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const MAX_MB = 5
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `Max ${MAX_MB}MB allowed` }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP or GIF' }, { status: 400 })

  const ext  = file.type.split('/')[1]
  const name = `${user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await supabase.storage.from('salon-images').upload(name, buffer, {
    contentType: file.type, upsert: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('salon-images').getPublicUrl(name)
  return NextResponse.json({ success: true, url: publicUrl, filename: name })
}
