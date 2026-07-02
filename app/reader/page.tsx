import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

export default async function ReaderPage() {
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

  if (!profile?.name) redirect('/onboarding?product=reader')

  const { data: feeds } = await supabase
    .from('rss_feeds')
    .select('id, label, url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#fff', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="border-b px-5 h-16 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1A1A1A' }}>
        <Link href="/" className="flex items-center gap-0.5">
          <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
          <span className="font-extrabold text-lg text-white">brief</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/digest" className="text-sm text-zinc-400 hover:text-white transition-colors">Digest</Link>
          <span className="text-sm font-semibold text-white border-b-2 pb-0.5" style={{ borderColor: '#2563EB' }}>Reader</span>
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-white transition-colors">Settings</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4" style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
            <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Good morning, {profile.name}.
          </h1>
          <p className="text-zinc-400">Your curated read will arrive in your inbox each morning.</p>
        </div>

        {/* Feeds */}
        <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white">Your subscriptions</h2>
            <Link href="/settings" className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: '#2563EB' }}>
              Manage
            </Link>
          </div>
          {feeds && feeds.length > 0 ? (
            <div className="space-y-2">
              {feeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1A1A1A' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{feed.label}</p>
                    <p className="text-xs text-zinc-500 truncate">{feed.url}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full ml-3 shrink-0" style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563EB' }}>Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-400 text-sm mb-4">No subscriptions connected yet.</p>
              <Link href="/settings" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#2563EB' }}>
                Add a subscription
              </Link>
            </div>
          )}
        </div>

        {/* Coming soon card */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
          <h2 className="text-sm font-bold text-white mb-2">Your first Reader digest</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Finbrief will scan your connected feeds tonight and send your first curated read tomorrow morning. Articles will be filtered to match your selected topics and summarised so you can decide what deserves your full attention.
          </p>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#1A1A1A' }}>
            <p className="text-xs text-zinc-600">Digests with Digest product? <Link href="/digest" className="hover:opacity-70" style={{ color: '#1D9E75' }}>Switch to Digest →</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
