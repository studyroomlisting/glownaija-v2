// @ts-nocheck
import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://glownaija.co.uk'
  const supabase = await createClient()

  const { data: salons } = await supabase.from('salons').select('slug,updated_at').eq('listing_status','approved').eq('is_active',true)
  const { data: products } = await supabase.from('products').select('id').eq('is_active',true)

  const staticPages = ['','/salons','/shop','/events','/search','/stylist','/chat','/contact','/privacy','/terms'].map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const salonPages = (salons || []).map(s => ({
    url: `${base}/salon/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const productPages = (products || []).map(p => ({
    url: `${base}/shop/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...salonPages, ...productPages]
}
