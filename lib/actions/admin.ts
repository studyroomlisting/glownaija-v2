// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')
  return { user, supabase: await createAdminClient() }
}

export async function deleteSalon(salonId: string) {
  const { supabase, user } = await requireAdmin()
  try {
    const { data: salon } = await supabase.from('salons').select('name').eq('id', salonId).single()
    const { error } = await supabase.from('salons').delete().eq('id', salonId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: `salon_deleted:${salon?.name || salonId}`, entity_type: 'salon', entity_id: salonId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not delete salon.' }
  }
}

export async function updateSalonStatus(salonId: string, status: string) {
  const { supabase, user } = await requireAdmin()
  try {
    const allowed = ['approved','suspended','rejected','archived']
    if (!allowed.includes(status)) return { error: 'Invalid status' }
    const { error } = await supabase.from('salons').update({ listing_status: status, is_active: status === 'approved' }).eq('id', salonId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: `salon_${status}`, entity_type: 'salon', entity_id: salonId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update salon status.' }
  }
}

export async function toggleVerified(salonId: string, verified: boolean) {
  const { supabase, user } = await requireAdmin()
  try {
    const { error } = await supabase.from('salons').update({ is_verified: verified }).eq('id', salonId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: verified ? 'salon_verified' : 'salon_unverified', entity_type: 'salon', entity_id: salonId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update verification.' }
  }
}

export async function toggleFeatured(salonId: string, featured: boolean) {
  const { supabase, user } = await requireAdmin()
  try {
    const until = featured ? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] : null
    const { error } = await supabase.from('salons').update({ is_featured: featured, featured_until: until }).eq('id', salonId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: featured ? 'salon_featured' : 'salon_unfeatured', entity_type: 'salon', entity_id: salonId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update featured status.' }
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const { supabase, user } = await requireAdmin()
  try {
    if (userId === user.id) return { error: 'Cannot modify your own account.' }
    const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: isActive ? 'none' : '876600h' })
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: isActive ? 'user_unbanned' : 'user_banned', entity_type: 'user', entity_id: userId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update user status.' }
  }
}

export async function toggleAdmin(userId: string, makeAdmin: boolean) {
  const { supabase, user } = await requireAdmin()
  try {
    if (userId === user.id) return { error: 'Cannot change your own admin status.' }
    const { error } = await supabase.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: makeAdmin ? 'admin_granted' : 'admin_revoked', entity_type: 'user', entity_id: userId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update admin status.' }
  }
}

export async function deleteReview(reviewId: string, salonId: string) {
  const { supabase, user } = await requireAdmin()
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'review_deleted', entity_type: 'review', entity_id: reviewId })
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not delete review.' }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { supabase, user } = await requireAdmin()
  try {
    const allowed = ['pending','paid','shipped','delivered','cancelled','refunded']
    if (!allowed.includes(status)) return { error: 'Invalid status' }
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) return { error: error.message }
    await supabase.from('audit_logs').insert({ user_id: user.id, action: `order_${status}`, entity_type: 'order', entity_id: orderId })

    // Refund confirmation — customer previously had no way to know a refund
    // happened except by noticing the order status changed on the site.
    if (status === 'refunded' && order) {
      try {
        const customerAuth = await supabase.auth.admin.getUserById(order.customer_id)
        const email = customerAuth.data.user?.email
        if (email) {
          const { sendRefundConfirmation } = await import('@/lib/email')
          await sendRefundConfirmation({
            email, firstName: order.full_name?.split(' ')[0] || 'there',
            reference: order.reference, amount: order.total,
            itemDescription: `Order ${order.reference}`,
          })
        }
      } catch { /* non-fatal — the status update itself already succeeded above */ }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not update order status.' }
  }
}
