// @ts-nocheck
// Notifies every admin, both in-app and by email, about something that just
// happened and may need their attention. Used for new bookings, cancellations,
// refunds, etc. — anywhere the earlier email audit found admins were silently
// left out of the loop.
export async function notifyAdmins(supabase: any, opts: {
  type: string; title: string; body: string; link?: string
}) {
  const { type, title, body, link } = opts
  try {
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
    if (!admins?.length) return

    // In-app notifications — one row per admin.
    await supabase.from('notifications').insert(
      admins.map((a: any) => ({ user_id: a.id, type, title, body, link: link || '/admin' }))
    )

    // Email each admin their real auth email (profiles.email can drift stale —
    // same reasoning as everywhere else in this app that emails a user).
    const { sendAdminAlert } = await import('./email')
    const { createAdminClient } = await import('./supabase/server')
    const adminClient = await createAdminClient()
    for (const a of admins) {
      try {
        const { data } = await adminClient.auth.admin.getUserById(a.id)
        if (data.user?.email) {
          await sendAdminAlert({ adminEmail: data.user.email, title, message: body, link })
        }
      } catch { /* one admin's lookup failing shouldn't block the others */ }
    }
  } catch { /* non-fatal — the calling action's main effect should never be blocked by this */ }
}
