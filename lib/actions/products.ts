// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')
  return { user, supabase: await createAdminClient() }
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin()

  const id           = formData.get('id') as string || null
  const name         = (formData.get('name')         as string).trim()
  const brand        = (formData.get('brand')        as string).trim()
  const category     = formData.get('category')      as string
  const description  = (formData.get('description') as string || '').trim()
  const ingredients  = (formData.get('ingredients') as string || '').trim()
  const how_to_use   = (formData.get('how_to_use')  as string || '').trim()
  const price        = Math.round(parseFloat(formData.get('price') as string || '0') * 100)
  const orig_price   = formData.get('original_price') ? Math.round(parseFloat(formData.get('original_price') as string) * 100) : null
  const stock_count  = parseInt(formData.get('stock_count') as string || '0')
  const badge        = (formData.get('badge')       as string || '').trim() || null
  const badge_type   = (formData.get('badge_type')  as string || '').trim() || null
  const tags_raw     = (formData.get('tags')        as string || '').split(',').map(t => t.trim()).filter(Boolean)
  const is_active    = formData.get('is_active') !== 'false'

  if (!name)   return { error: 'Product name is required.' }
  if (!brand)  return { error: 'Brand is required.' }
  if (price <= 0) return { error: 'Price must be greater than £0.' }

  const payload = {
    name, brand, category,
    description:  description  || null,
    ingredients:  ingredients  || null,
    how_to_use:   how_to_use   || null,
    price,
    original_price: orig_price,
    stock_count,
    badge, badge_type,
    tags: tags_raw,
    is_active,
  }

  if (id) {
    // Update existing
    const { error } = await supabase.from('products').update(payload).eq('id', id)
    if (error) return { error: 'Could not update product.' }
  } else {
    // Insert new
    const { error } = await supabase.from('products').insert(payload)
    if (error) return { error: 'Could not add product.' }
  }

  revalidatePath('/shop')
  revalidatePath('/admin')
  return { success: true }
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const { supabase } = await requireAdmin()
  await supabase.from('products').update({ is_active: isActive }).eq('id', productId)
  revalidatePath('/admin')
  revalidatePath('/shop')
  return { success: true }
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireAdmin()
  // Soft delete — deactivate rather than destroy (preserves order history)
  await supabase.from('products').update({ is_active: false, stock_count: 0 }).eq('id', productId)
  revalidatePath('/admin')
  revalidatePath('/shop')
  return { success: true }
}

export async function updateStock(productId: string, newStock: number) {
  const { supabase } = await requireAdmin()
  if (newStock < 0) return { error: 'Stock cannot be negative.' }
  await supabase.from('products').update({ stock_count: newStock }).eq('id', productId)
  revalidatePath('/admin')
  return { success: true }
}
