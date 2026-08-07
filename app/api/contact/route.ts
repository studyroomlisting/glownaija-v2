// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail, isValidName } from '@/lib/utils'
import { sendContactMessage } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const name    = (body.name    || '').trim()
  const email   = (body.email   || '').trim().toLowerCase()
  const subject = (body.subject || '').trim()
  const message = (body.message || '').trim()

  if (!isValidName(name))   return NextResponse.json({ error: 'Please enter your full name (letters only).' }, { status: 400 })
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  if (message.length < 10)  return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })

  const rl = await checkRateLimit(email, 'contact', 5, 60)
  if (!rl.allowed) return NextResponse.json({ error: rl.error }, { status: 429 })

  try {
    await sendContactMessage({ name, email, subject, message })
  } catch {
    // Non-fatal — still confirm receipt to the user even if the email dispatch fails
  }

  return NextResponse.json({ success: true })
}
