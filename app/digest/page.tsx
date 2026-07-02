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

  const { data: allRows } = await supabase
    .from('digests')
    .select('id, digest_type, created_at, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const toRow = (d: any) => ({ id: d.id, digest_type: d.digest_type, created_at: d.created_at, content: d.content as DigestContent })
  const READER_TYPES = new Set(['reader', 'reader_custom'])
  const digests = (allRows ?? []).filter(d => !READER_TYPES.has(d.digest_type)).map(toRow)
  const readerDigests = (allRows ?? []).filter(d => READER_TYPES.has(d.digest_type)).map(toRow)

  return (
    <DigestPageClient
      userId={user.id}
      digests={digests}
      readerDigests={readerDigests}
      products={profile?.products ?? 'digest'}
      userName={profile?.name ?? ''}
    />
  )
}
