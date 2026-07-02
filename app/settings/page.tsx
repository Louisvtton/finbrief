import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
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

  const [{ data: profile }, { data: watchlist }, { data: industries }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('watchlist_items').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('followed_industries').select('*').eq('user_id', user.id).order('created_at'),
  ])

  return (
    <main className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/digest" className="font-bold text-lg" style={{ color: '#1D9E75' }}>finbrief</a>
          <a
            href="/digest"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-gray-600 hover:bg-zinc-50 transition-colors"
          >
            ← Back to my digest
          </a>
        </div>
      </nav>
      <SettingsClient
        userId={user.id}
        profile={profile}
        initialWatchlist={(watchlist ?? []).map((w: any) => ({
          id: w.id, ticker: w.ticker, name: w.name, assetType: w.asset_type,
        }))}
        initialIndustries={(industries ?? []).map((i: any) => i.label)}
      />
    </main>
  )
}
