import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import OnboardingFlow from '@/components/OnboardingFlow'

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ product?: string; add?: string }> }) {
  const cookieStore = await cookies()
  const params = await searchParams
  const product = (params.product === 'reader' ? 'reader' : 'digest') as 'digest' | 'reader'
  const isAdding = params.add === 'true'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, products')
    .eq('id', user.id)
    .single()

  if (profile?.name && !isAdding) redirect(profile.products === 'reader' ? '/reader' : '/digest')

  return <OnboardingFlow userId={user.id} product={product} isAdding={isAdding} existingName={profile?.name ?? ''} />
}
