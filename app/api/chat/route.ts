// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Rate limit: 20 req/min per IP
const rateLimits = new Map<string, number[]>()

const SYSTEM = `You are Glow AI, the expert beauty assistant for GlowNaija — the UK's leading Nigerian and Afro-Caribbean hair and beauty platform, built by Nexova Technologies.

YOUR EXPERTISE:
- Afro, natural, and textured hair care (4A, 4B, 4C, 3C, locs, braids, wigs, weaves, relaxed)
- Hair care routines, protective styles, moisture retention, porosity, scalp health
- Nigerian and Afro-Caribbean beauty traditions, ingredients, and techniques
- Skincare for melanin-rich skin (hyperpigmentation, dark spots, SPF, ingredients)
- UK salon recommendations — guide users to search on GlowNaija at glownaija.co.uk/salons
- Product recommendations from the GlowNaija shop at glownaija.co.uk/shop
- Booking appointments via glownaija.co.uk/booking
- Events and workshops at glownaija.co.uk/events

PERSONALITY:
- Warm, encouraging, and culturally aware
- Use occasional Nigerian/Afro-Caribbean cultural references naturally
- Address the person directly and personally
- Be practical — give actionable advice, not just general info
- Use emojis sparingly but naturally

RESPONSE STYLE:
- Keep responses focused and concise (2-4 paragraphs max)
- Use bullet points for steps or lists of products/tips
- For salon recommendations, always direct to: glownaija.co.uk/salons or /salons?city=CITY
- For product questions, direct to: glownaija.co.uk/shop
- For bookings: glownaija.co.uk/booking
- Never diagnose medical conditions — suggest consulting a professional

IMPORTANT RULES:
- Only give beauty, hair care, and GlowNaija-related advice
- If asked about unrelated topics, politely redirect to beauty/GlowNaija
- Never make up specific salon names or product prices
- Don't provide medical diagnoses or treatments`

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const hits = (rateLimits.get(ip) || []).filter(t => t > now - 60000)
  if (hits.length >= 20) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }
  rateLimits.set(ip, [...hits, now])

  try {
    const { messages, context } = await request.json()
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Validate message format
    const validMessages = messages
      .filter((m: any) => m.role && m.content && typeof m.content === 'string')
      .slice(-20) // Keep last 20 messages for context window management
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    if (!validMessages.length) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    // Add user context if provided (hair type, city etc)
    let systemPrompt = SYSTEM
    if (context?.hairType) {
      systemPrompt += `\n\nUSER CONTEXT: Hair type: ${context.hairType}.`
    }
    if (context?.city) {
      systemPrompt += ` Located in: ${context.city}, UK.`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: validMessages,
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    return NextResponse.json({
      response: text,
      usage: {
        input_tokens:  response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    })
  } catch (error: any) {
    console.error('[Glow AI error]', error?.message)
    if (error?.status === 401) {
      return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Glow AI is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
