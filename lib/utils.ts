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

/**
 * UK phone numbers only — this platform is UK-only, so salon contact numbers
 * are validated against the UK national format specifically, not just "looks
 * like a phone number." Accepts 07700 900000, +44 7700 900000, 020 7946 0958,
 * +442079460958, etc. (spaces/hyphens/parens are stripped before checking).
 */
export function isValidUKPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^(?:\+44\d{10}|0\d{10})$/.test(cleaned)
}

/** Business/salon name — letters, spaces, and basic name punctuation only (no digits or other symbols), per explicit product requirement. */
export function isValidBusinessName(name: string): boolean {
  return /^[A-Za-z][A-Za-z\s'.-]{1,79}$/.test(name.trim())
}

/**
 * Single source of truth for every UK city selectable across the app — salon
 * creation, salon editing, and the /salons filter dropdown all use this list.
 * Previously each of those had its own separately hardcoded array, and they'd
 * already drifted out of sync (the homepage's list was missing 3 cities that
 * every other list had). Centralizing here means that can't happen again.
 */
/**
 * The exact same service categories shown in the homepage's "Browse by
 * Category" section and used as salons.service_types values. Centralized here
 * so search can recognize a category name (e.g. "braids", "barber") and find
 * salons that offer it — even when no individual service's literal name field
 * happens to contain that word (e.g. a service named "Skin Fade" with
 * category='barber' has nothing called "barber" in its name).
 */
export const SERVICE_CATEGORIES = [
  { slug: 'braids',   label: 'Braids' },
  { slug: 'locs',     label: 'Locs' },
  { slug: 'wigs',     label: 'Wigs' },
  { slug: 'nails',    label: 'Nails' },
  { slug: 'makeup',   label: 'Makeup' },
  { slug: 'skincare', label: 'Skincare' },
  { slug: 'barber',   label: 'Barber' },
  { slug: 'bridal',   label: 'Bridal' },
  { slug: 'natural',  label: 'Natural Hair' },
  { slug: 'colour',   label: 'Colour' },
  { slug: 'wax',      label: 'Waxing' },
]

/** Returns the matching category slug if the search text names a known category (by slug or label, either direction), otherwise null. */
export function matchServiceCategory(query: string): string | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const c of SERVICE_CATEGORIES) {
    const label = c.label.toLowerCase()
    if (q === c.slug || q === label || label.includes(q) || q.includes(c.slug)) return c.slug
  }
  return null
}

export const UK_CITIES = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff']

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
