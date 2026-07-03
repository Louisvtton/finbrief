import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/digest'
  const product = searchParams.get('product') ?? 'digest'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, products')
          .eq('id', user.id)
          .single()

        if (!profile?.name) {
          return NextResponse.redirect(new URL(`/auth/confirmed?next=${encodeURIComponent(`/onboarding?product=${product}`)}`, req.url))
        }

        let dest = '/digest'
        if (product === 'reader') {
          const hasReader = profile.products === 'reader' || profile.products === 'both'
          dest = hasReader ? '/digest?tab=reader' : `/onboarding?product=reader&add=true`
        }
        return NextResponse.redirect(new URL(`/auth/confirmed?next=${encodeURIComponent(dest)}`, req.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
}
