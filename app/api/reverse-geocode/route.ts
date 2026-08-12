// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`,
      // Nominatim's usage policy requires an identifying User-Agent for server-side requests.
      { headers: { 'User-Agent': 'GlowNaija/1.0 (https://glownaija.co.uk)' } }
    )
    if (!res.ok) return NextResponse.json({ error: 'Could not detect location' }, { status: 502 })

    const data = await res.json()
    const addr = data.address || {}
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || addr.suburb || null
    const country = addr.country || null

    return NextResponse.json({ city, country })
  } catch {
    return NextResponse.json({ error: 'Could not detect location' }, { status: 500 })
  }
}
