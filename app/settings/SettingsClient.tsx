'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AssetSearch from '@/components/AssetSearch'
import SourcePicker from '@/components/SourcePicker'
import type { WatchlistItem } from '@/types'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer Goods',
  'Real Estate', 'Automotive', 'AI & Machine Learning', 'Biotech', 'Semiconductors',
]

const JOB_ROLES = [
  { value: 'retail_investor', label: '📈 Retail investor', desc: 'I invest my own money' },
  { value: 'trader', label: '⚡ Active trader', desc: 'I trade frequently' },
  { value: 'fund_manager', label: '🏦 Fund / portfolio manager', desc: 'I manage others\' capital' },
  { value: 'financial_advisor', label: '🤝 Financial advisor', desc: 'I advise clients' },
  { value: 'analyst', label: '🔬 Analyst / researcher', desc: 'I research markets' },
  { value: 'founder', label: '🚀 Founder / entrepreneur', desc: 'I run a business' },
  { value: 'professional', label: '💼 Finance professional', desc: 'I work in finance' },
  { value: 'curious', label: '🧠 Curious learner', desc: 'I want to understand markets' },
]

const NEWSLETTER_GOALS = [
  { value: 'daily_brief', label: '☀️ Stay on top of my portfolio daily' },
  { value: 'opportunities', label: '💡 Spot investment opportunities' },
  { value: 'macro', label: '🌍 Track macro trends and news' },
  { value: 'risk', label: '🛡️ Monitor risk in my holdings' },
  { value: 'client_prep', label: '📋 Prepare for client conversations' },
  { value: 'general', label: '📰 General market awareness' },
]

function encodeFrequency(daily: string, weekly: boolean): string {
  if (daily === 'none') return weekly ? 'weekly' : 'daily'
  return weekly ? `${daily}+weekly` : daily
}

function decodeFrequency(freq: string): { daily: string; weekly: boolean } {
  if (!freq) return { daily: 'daily', weekly: false }
  if (freq === 'weekly') return { daily: 'none', weekly: true }
  if (freq.endsWith('+weekly')) return { daily: freq.replace('+weekly', ''), weekly: true }
  return { daily: freq, weekly: false }
}

export default function SettingsClient({
  userId,
  profile,
  initialWatchlist,
  initialIndustries,
}: {
  userId: string
  profile: any
  initialWatchlist: WatchlistItem[]
  initialIndustries: string[]
}) {
  const router = useRouter()
  const decoded = decodeFrequency(profile?.frequency)

  const [name, setName] = useState(profile?.name ?? '')
  const [dailyFreq, setDailyFreq] = useState(decoded.daily)
  const [weeklyDigest, setWeeklyDigest] = useState(decoded.weekly)
  const [digestTime, setDigestTime] = useState(profile?.digest_time ?? 'pre')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist)
  const [industries, setIndustries] = useState<string[]>(initialIndustries)
  const [customIndustry, setCustomIndustry] = useState('')
  const [preferredSources, setPreferredSources] = useState<string[]>(
    profile?.preferred_sources
      ? profile.preferred_sources.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  )
  // RSS feeds
  const [rssFeeds, setRssFeeds] = useState<{ id: string; label: string; url: string }[]>([])
  const [rssFeedsLoaded, setRssFeedsLoaded] = useState(false)
  const [rssLabel, setRssLabel] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [rssAdding, setRssAdding] = useState(false)
  const [rssError, setRssError] = useState('')

  const loadRssFeeds = async () => {
    if (rssFeedsLoaded) return
    const res = await fetch(`/api/rss-feeds?userId=${userId}`)
    const data = await res.json()
    setRssFeeds(data.feeds ?? [])
    setRssFeedsLoaded(true)
  }

  const addRssFeed = async () => {
    if (!rssLabel.trim() || !rssUrl.trim()) return
    setRssAdding(true)
    setRssError('')
    try {
      const res = await fetch('/api/rss-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, label: rssLabel.trim(), url: rssUrl.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRssFeeds(prev => [...prev, data.feed])
      setRssLabel('')
      setRssUrl('')
    } catch (e: any) {
      setRssError(e.message)
    } finally {
      setRssAdding(false)
    }
  }

  const removeRssFeed = async (id: string) => {
    await fetch('/api/rss-feeds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId }),
    })
    setRssFeeds(prev => prev.filter(f => f.id !== id))
  }

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // About you
  const savedRole = profile?.job_role ?? ''
  const knownRoles = JOB_ROLES.map(r => r.value)
  const [jobRole, setJobRole] = useState(knownRoles.includes(savedRole) ? savedRole : (savedRole ? 'other' : ''))
  const [customJobRole, setCustomJobRole] = useState(knownRoles.includes(savedRole) ? '' : savedRole)
  const rawGoal = profile?.newsletter_goal ?? ''
  const [goalPart, extraPart] = rawGoal.includes(' — ') ? rawGoal.split(' — ') : [rawGoal, '']
  const [newsletterGoals, setNewsletterGoals] = useState<string[]>(
    goalPart ? goalPart.split(', ').map((g: string) => g.trim()).filter(Boolean) : []
  )
  const [extraContext, setExtraContext] = useState(extraPart ?? '')

  const toggleIndustry = async (label: string) => {
    if (industries.includes(label)) {
      await supabase.from('followed_industries').delete().eq('user_id', userId).eq('label', label)
      setIndustries(prev => prev.filter(i => i !== label))
    } else {
      await supabase.from('followed_industries').insert({ user_id: userId, label })
      setIndustries(prev => [...prev, label])
    }
  }

  const addCustomIndustry = async () => {
    const trimmed = customIndustry.trim()
    if (!trimmed || industries.includes(trimmed)) return
    await supabase.from('followed_industries').insert({ user_id: userId, label: trimmed, is_custom: true })
    setIndustries(prev => [...prev, trimmed])
    setCustomIndustry('')
  }

  const removeCustomIndustry = async (label: string) => {
    await supabase.from('followed_industries').delete().eq('user_id', userId).eq('label', label)
    setIndustries(prev => prev.filter(i => i !== label))
  }

  const saveProfile = async () => {
    setSaving(true)
    const finalJobRole = jobRole === 'other' ? customJobRole : jobRole
    const finalGoal = newsletterGoals.join(', ') + (extraContext.trim() ? ` — ${extraContext.trim()}` : '')
    await supabase.from('profiles').update({
      name,
      frequency: encodeFrequency(dailyFreq, weeklyDigest),
      digest_time: digestTime,
      job_role: finalJobRole,
      newsletter_goal: finalGoal,
      preferred_sources: preferredSources.join(','),
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">

      {/* Profile */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
            />
          </div>

          {/* Daily frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily digest</label>
            <div className="flex gap-2">
              {[{ value: 'daily', label: 'Once a day' }, { value: '2x', label: 'Twice a day' }, { value: 'none', label: 'No daily' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDailyFreq(opt.value)}
                  className="flex-1 py-2 rounded-lg text-sm border font-medium transition-colors"
                  style={
                    dailyFreq === opt.value
                      ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly toggle */}
          <div className="flex items-center justify-between py-2 px-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Weekly summary</p>
              <p className="text-xs text-gray-400">A broader recap every week</p>
            </div>
            <button
              onClick={() => setWeeklyDigest(prev => !prev)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ backgroundColor: weeklyDigest ? '#1D9E75' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: weeklyDigest ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* Digest timing — only if daily is active */}
          {dailyFreq !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daily timing</label>
              <div className="flex gap-2">
                {[{ value: 'pre', label: '☀️ Pre-market' }, { value: 'eod', label: '📊 End of day' }, { value: 'both', label: '⚡ Both' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDigestTime(opt.value)}
                    className="flex-1 py-2 rounded-lg text-sm border font-medium transition-colors"
                    style={
                      digestTime === opt.value
                        ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ backgroundColor: saved ? '#378ADD' : '#1D9E75' }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* About you */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">About you</h2>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">What best describes you?</label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_ROLES.map(role => (
                <button
                  key={role.value}
                  onClick={() => setJobRole(role.value)}
                  className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all"
                  style={
                    jobRole === role.value
                      ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                  }
                >
                  <span className="text-sm font-medium">{role.label}</span>
                  <span className="text-xs mt-0.5 opacity-70">{role.desc}</span>
                </button>
              ))}
              <button
                onClick={() => setJobRole('other')}
                className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all col-span-2"
                style={
                  jobRole === 'other'
                    ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                }
              >
                <span className="text-sm font-medium">✏️ Other</span>
                <span className="text-xs mt-0.5 opacity-70">My role isn't listed above</span>
              </button>
            </div>
            {jobRole === 'other' && (
              <input
                value={customJobRole}
                onChange={e => setCustomJobRole(e.target.value)}
                placeholder="Describe your role (e.g. Hedge fund associate…)"
                className="mt-3 w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">What are you expecting from Finbrief?</label>
            <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
            <div className="space-y-2">
              {NEWSLETTER_GOALS.map(goal => {
                const selected = newsletterGoals.includes(goal.value)
                return (
                  <button
                    key={goal.value}
                    onClick={() => setNewsletterGoals(prev =>
                      selected ? prev.filter(g => g !== goal.value) : [...prev, goal.value]
                    )}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium"
                    style={
                      selected
                        ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    <span>{goal.label}</span>
                    {selected && <span className="text-white text-xs shrink-0">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Anything else? <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              placeholder="e.g. I focus on UK mid-cap stocks, I'm preparing for retirement…"
              rows={2}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ backgroundColor: saved ? '#378ADD' : '#1D9E75' }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Watchlist */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Watchlist</h2>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <AssetSearch
            userId={userId}
            existing={watchlist}
            onAdd={item => setWatchlist(prev => [...prev, item])}
            onRemove={id => setWatchlist(prev => prev.filter(i => i.id !== id))}
          />
        </div>
      </section>

      {/* Industries */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Followed Industries</h2>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndustry(ind)}
                className="px-4 py-2 rounded-full text-sm border transition-colors"
                style={
                  industries.includes(ind)
                    ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                }
              >
                {ind}
              </button>
            ))}
          </div>

          {industries.filter(i => !INDUSTRIES.includes(i)).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Your custom topics</p>
              <div className="flex flex-wrap gap-2">
                {industries.filter(i => !INDUSTRIES.includes(i)).map(ind => (
                  <div key={ind} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
                    style={{ backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }}>
                    <span>{ind}</span>
                    <button onClick={() => removeCustomIndustry(ind)} className="opacity-70 hover:opacity-100 leading-none">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={customIndustry}
              onChange={e => setCustomIndustry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomIndustry()}
              placeholder="Add custom topic (e.g. Space industry, Luxury goods…)"
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
            />
            <button
              onClick={addCustomIndustry}
              className="px-4 py-2 rounded-lg text-sm text-white font-medium"
              style={{ backgroundColor: '#378ADD' }}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* News sources */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">News sources</h2>
        <p className="text-sm text-gray-400 mb-4">Industry news will only come from sources you select. Leave blank to use our neutral default (Reuters, AP, BBC).</p>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <SourcePicker selected={preferredSources} onChange={setPreferredSources} />
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ backgroundColor: saved ? '#378ADD' : '#1D9E75' }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Premium RSS feeds */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Premium news feeds</h2>
        <p className="text-sm text-gray-400 mb-4">
          Have an FT, WSJ, or Economist subscription? Paste your personal RSS feed URL here and we'll include those articles in your digest.
        </p>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-5">

          {/* How to find RSS guide */}
          <details className="group" onToggle={loadRssFeeds}>
            <summary className="cursor-pointer text-sm font-semibold text-[#1D9E75] list-none flex items-center gap-1.5 select-none">
              <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
              How to find your personal RSS URL
            </summary>
            <div className="mt-3 space-y-3 text-sm text-gray-500 leading-relaxed pl-5 border-l-2 border-[#1D9E75]/20">
              <div>
                <span className="font-semibold text-gray-700">🗞 Financial Times</span>
                <p>Log in → click your name top-right → <em>My FT</em> → <em>Manage alerts</em> → find any alert → click the RSS icon. Or go directly to <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">ft.com/myft/following</code> and look for the RSS link.</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">📰 Wall Street Journal</span>
                <p>Log in → go to <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">wsj.com/news/rss-news-and-feeds</code> → select a feed. Your subscriber session authenticates automatically.</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">📊 The Economist</span>
                <p>Log in → go to <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">economist.com/rss</code> → copy any feed URL. Subscriber content unlocks when your account cookie is present.</p>
              </div>
              <p className="text-xs text-gray-400">⚠️ Your RSS URL may contain a private token — treat it like a password. We never share it.</p>
            </div>
          </details>

          {/* Existing feeds */}
          {rssFeedsLoaded && rssFeeds.length > 0 && (
            <div className="space-y-2">
              {rssFeeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-100 bg-zinc-50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{feed.label}</p>
                    <p className="text-xs text-gray-400 truncate">{feed.url}</p>
                  </div>
                  <button
                    onClick={() => removeRssFeed(feed.id)}
                    className="text-xs text-red-400 hover:text-red-600 shrink-0 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new feed */}
          <div className="space-y-2">
            <input
              value={rssLabel}
              onChange={e => setRssLabel(e.target.value)}
              placeholder="Label (e.g. My FT feed, WSJ Markets)"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
              onFocus={loadRssFeeds}
            />
            <input
              value={rssUrl}
              onChange={e => setRssUrl(e.target.value)}
              placeholder="RSS URL (e.g. https://www.ft.com/rss/home/...)"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
              onKeyDown={e => e.key === 'Enter' && addRssFeed()}
            />
            {rssError && <p className="text-xs text-red-500">{rssError}</p>}
            <button
              onClick={addRssFeed}
              disabled={rssAdding || !rssLabel.trim() || !rssUrl.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ backgroundColor: '#1D9E75' }}
            >
              {rssAdding ? 'Adding…' : '+ Add feed'}
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <button
            onClick={signOut}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
