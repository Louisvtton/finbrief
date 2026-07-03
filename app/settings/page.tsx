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

  const [{ data: profile }, { data: watchlist }, { data: industries }, { data: rssFeeds }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('watchlist_items').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('followed_industries').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('rss_feeds').select('*').eq('user_id', user.id).order('created_at'),
  ])

  return (
    <SettingsClient
      userId={user.id}
      profile={profile}
      products={profile?.products ?? 'digest'}
      initialWatchlist={(watchlist ?? []).map((w: any) => ({
        id: w.id, ticker: w.ticker, name: w.name, assetType: w.asset_type,
      }))}
      initialIndustries={(industries ?? []).map((i: any) => i.label)}
      initialRssFeeds={(rssFeeds ?? []).map((f: any) => ({ id: f.id, label: f.label, url: f.url }))}
    />
  )
}
