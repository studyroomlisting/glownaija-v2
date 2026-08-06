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

export async function updateSalonStatus(salonId: string, status: string) {
  const { supabase, user } = await requireAdmin()
  const allowed = ['approved','suspended','rejected','archived']
  if (!allowed.includes(status)) return { error: 'Invalid status' }
  await supabase.from('salons').update({ listing_status: status, is_active: status === 'approved' }).eq('id', salonId)
  await supabase.from('audit_logs').insert({ user_id: user.id, action: `salon_${status}`, entity_type: 'salon', entity_id: salonId })
  revalidatePath('/admin')
  return { success: true }
}

export async function toggleFeatured(salonId: string, featured: boolean) {
  const { supabase, user } = await requireAdmin()
  const until = featured ? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] : null
  await supabase.from('salons').update({ is_featured: featured, featured_until: until }).eq('id', salonId)
  await supabase.from('audit_logs').insert({ user_id: user.id, action: featured ? 'salon_featured' : 'salon_unfeatured', entity_type: 'salon', entity_id: salonId })
  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const { supabase, user } = await requireAdmin()
  if (userId === user.id) return { error: 'Cannot modify your own account.' }
  await supabase.auth.admin.updateUserById(userId, { ban_duration: isActive ? 'none' : '876600h' })
  await supabase.from('audit_logs').insert({ user_id: user.id, action: isActive ? 'user_unbanned' : 'user_banned', entity_type: 'user', entity_id: userId })
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteReview(reviewId: string, salonId: string) {
  const { supabase, user } = await requireAdmin()
  await supabase.from('reviews').delete().eq('id', reviewId)
  await supabase.from('audit_logs').insert({ user_id: user.id, action: 'review_deleted', entity_type: 'review', entity_id: reviewId })
  revalidatePath('/admin')
  return { success: true }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { supabase } = await requireAdmin()
  await supabase.from('orders').update({ status }).eq('id', orderId)
  revalidatePath('/admin')
  return { success: true }
}
