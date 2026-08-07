// @ts-nocheck
// Lightweight app-level rate limiter for endpoints Supabase's own throttling doesn't
// cover with a specific policy (sign-in attempts, password-reset requests, contact
// form spam). Backed by supabase/migrations/010_rate_limiting.sql.
import { createAdminClient } from '@/lib/supabase/server'

interface RateLimitResult { allowed: boolean; error?: string }

/**
 * @param identifier  Usually the email address the action targets.
 * @param action      A short label, e.g. 'signin', 'reset_password', 'contact'.
 * @param maxAttempts How many attempts are allowed inside the window.
 * @param windowMinutes The rolling window size, in minutes.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  try {
    const supabase = await createAdminClient()
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart)

    if ((count || 0) >= maxAttempts) {
      return { allowed: false, error: `Too many attempts. Please try again in ${windowMinutes} minute${windowMinutes !== 1 ? 's' : ''}.` }
    }

    await supabase.from('rate_limit_attempts').insert({ identifier, action })

    // Opportunistic cleanup — deletes this identifier/action's rows older than the
    // window on roughly 1 in 10 checks, so the table doesn't grow unbounded without
    // needing a separate cron job.
    if (Math.random() < 0.1) {
      supabase.from('rate_limit_attempts').delete().lt('created_at', windowStart).then(() => {})
    }

    return { allowed: true }
  } catch {
    // Fail open — if the rate-limit check itself breaks, don't block real users out
    // of sign-in over an infrastructure hiccup.
    return { allowed: true }
  }
}
