// @ts-nocheck
// Bookings have no payment webhook that flips them to 'cancelled' on timeout, and this
// project has no cron/queue infrastructure. Instead, call this at the top of any page
// that reads bookings (dashboard, admin, account, confirmation) — it lazily sweeps any
// pending+unpaid booking whose 15-minute payment window has passed and marks it
// cancelled, so the status is always accurate by the time it's displayed.
export async function expireStaleBookings(supabase: any) {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  try {
    await supabase.from('bookings')
      .update({ status: 'cancelled' })
      .eq('status', 'pending')
      .eq('deposit_paid', false)
      .lt('created_at', cutoff)
  } catch { /* non-fatal — worst case a stale booking shows as pending for one more view */ }
}
