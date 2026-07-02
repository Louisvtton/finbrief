import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DigestPageClient from '@/components/DigestPageClient'
import type { DigestContent } from '@/types'

export default async function DigestPage() {
  const cookieStore = await cookies()

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

  // Fetch last 30 digests — newest first
  const { data: digestRows } = await supabase
    .from('digests')
    .select('id, digest_type, created_at, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const digests = (digestRows ?? []).map((d: any) => ({
    id: d.id,
    digest_type: d.digest_type,
    created_at: d.created_at,
    content: d.content as DigestContent,
  }))

  return (
    <DigestPageClient
      userId={user.id}
      digests={digests}
      products={profile?.products ?? 'digest'}
      userName={profile?.name ?? ''}
    />
  )
}
