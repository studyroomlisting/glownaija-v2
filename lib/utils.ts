// @ts-nocheck
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtPrice(pence: number): string {
  return '£' + (pence / 100).toFixed(2)
}

export function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function generateRef(prefix: string): string {
  const d = new Date()
  const yr = d.getFullYear()
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${yr}-${rand}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUKPostcode(pc: string): boolean {
  return /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(pc)
}

/**
 * Today's date as YYYY-MM-DD in the UK's actual local time (Europe/London),
 * not the server/browser's own timezone. This app is UK-only — every "is this
 * today / is this in the past" check must be anchored to UK time, especially
 * server-side (Vercel always runs in UTC, which silently drifts from UK time
 * during BST and can be flat-out wrong near midnight).
 */
export function ukDateString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Current time as HH:MM in UK local time (Europe/London), BST/GMT-aware. */
export function ukTimeString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value
  return `${get('hour')}:${get('minute')}`
}

export function isValidPhone(phone: string): boolean {
  return /^[0-9+\s()\-]{7,20}$/.test(phone)
}

export function isValidName(name: string): boolean {
  return /^[A-Za-z][A-Za-z\s'.-]{1,59}$/.test(name.trim())
}

interface SocialPlatformConfig { domains: string[]; canonicalDomain: string; handlePrefix?: string; label: string }

const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> = {
  instagram: { domains: ['instagram.com'], canonicalDomain: 'instagram.com', label: 'Instagram' },
  facebook:  { domains: ['facebook.com', 'fb.com'], canonicalDomain: 'facebook.com', label: 'Facebook' },
  twitter:   { domains: ['twitter.com', 'x.com'], canonicalDomain: 'x.com', label: 'Twitter / X' },
  youtube:   { domains: ['youtube.com', 'youtu.be'], canonicalDomain: 'youtube.com', handlePrefix: '@', label: 'YouTube' },
  linkedin:  { domains: ['linkedin.com'], canonicalDomain: 'linkedin.com', label: 'LinkedIn' },
  google_business: { domains: ['google.com', 'g.page', 'goo.gl', 'maps.app.goo.gl'], canonicalDomain: 'g.page', label: 'Google Business' },
}

/**
 * Normalizes a social-media field into a full https:// URL, or returns an error
 * if the input clearly belongs to a different platform (e.g. pasting a Facebook
 * link into the Twitter field). Accepts a bare handle ("yoursalon") just as
 * happily as a full URL — bare handles are expanded against the platform's
 * canonical domain.
 */
export function normalizeSocialUrl(raw: string, platform: keyof typeof SOCIAL_PLATFORMS): { url: string | null; error?: string } {
  const input = raw.trim()
  if (!input) return { url: null }

  const config = SOCIAL_PLATFORMS[platform]
  const stripped = input.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const looksLikeUrl = stripped.includes('.') && stripped.includes('/')

  if (looksLikeUrl) {
    const domainMatches = config.domains.some(d => stripped.toLowerCase().startsWith(d))
    if (!domainMatches) return { url: null, error: `That doesn't look like a ${config.label} link. Please paste a ${config.canonicalDomain} URL, or just your handle.` }
    return { url: `https://${stripped.replace(/\/+$/, '')}` }
  }

  // Treat as a bare handle — strip a leading @ before rebuilding, then re-add the
  // platform's expected prefix (only YouTube uses @handles in its URL structure).
  const handle = stripped.replace(/^@/, '').replace(/^\/+|\/+$/g, '')
  if (!handle) return { url: null }
  if (!/^[a-zA-Z0-9._-]{1,60}$/.test(handle)) return { url: null, error: `${config.label} handle looks invalid.` }

  return { url: `https://${config.canonicalDomain}/${config.handlePrefix || ''}${handle}` }
}

/** WhatsApp is a phone number, not a handle — normalizes to a wa.me link. */
export function normalizeWhatsApp(raw: string): { url: string | null; error?: string } {
  const input = raw.trim()
  if (!input) return { url: null }
  if (/^https?:\/\/(www\.)?wa\.me\//i.test(input)) return { url: input }
  const digits = input.replace(/[^0-9]/g, '')
  if (digits.length < 7 || digits.length > 15) return { url: null, error: 'Please enter a valid WhatsApp number, e.g. +44 7700 900000.' }
  return { url: `https://wa.me/${digits}` }
}

// Generate 30-minute slots between open and close time
export function generateSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = []
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  while (cur < end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += 30
  }
  return slots
}
