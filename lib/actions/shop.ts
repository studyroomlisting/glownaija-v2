// @ts-nocheck
'use server'
import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'

export async function addToWishlist(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in to save products.' }

  const { data: existing } = await supabase.from('saved_products').select('id').eq('user_id', user.id).eq('product_id', productId).single()
  if (existing) {
    await supabase.from('saved_products').delete().eq('id', existing.id)
    return { saved: false }
  }
  await supabase.from('saved_products').insert({ user_id: user.id, product_id: productId })
  return { saved: true }
}
