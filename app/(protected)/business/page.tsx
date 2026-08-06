// @ts-nocheck
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessForm from '@/components/business/BusinessForm'

export default async function BusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: existing } = await supabase.from('salons').select('id').eq('owner_id',user.id).single()
  if (existing) redirect('/dashboard')

  const bTypes = ['Hair Salon','Locs Specialist','Wig Studio','Nail Bar','Makeup Artist','Skincare Studio','Mobile Stylist','Beauty Spa','Barbershop','Afro Barber','Threading & Waxing','Eyebrow Studio','Eyelash Studio','Bridal Studio','Other']
  const cities  = ['London','Birmingham','Manchester','Leeds','Bristol','Sheffield','Nottingham','Leicester','Liverpool','Newcastle','Glasgow','Edinburgh','Cardiff','Other']

  return (
    <div className="container py-10 max-w-2xl">
      <div className="text-center mb-8"><h1 className="text-3xl font-black mb-2">List Your Salon 🏪</h1><p className="text-ink-3">Takes 2 minutes · Goes live immediately</p></div>
      <div className="card card-body">
        <BusinessForm bTypes={bTypes} cities={cities} />
      </div>
    </div>
  )
}
