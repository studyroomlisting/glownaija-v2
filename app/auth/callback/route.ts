// @ts-nocheck
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Google OAuth doesn't let us set raw_user_meta_data at signup time, so the role picked
    // on the signup page is passed through this redirect URL instead and applied here.
    if (role === 'owner' && data?.user) {
      await supabase.from('profiles').update({ account_type: 'owner' }).eq('id', data.user.id)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
