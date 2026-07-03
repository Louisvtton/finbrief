'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AssetSearch from '@/components/AssetSearch'
import SourcePicker from '@/components/SourcePicker'
import type { WatchlistItem } from '@/types'
import Link from 'next/link'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer Goods',
  'Real Estate', 'Automotive', 'AI & Machine Learning', 'Biotech', 'Semiconductors',
]

const JOB_ROLES = [
  { value: 'retail_investor', label: 'Retail investor', desc: 'I invest my own money' },
  { value: 'trader', label: 'Active trader', desc: 'I trade frequently' },
  { value: 'fund_manager', label: 'Fund / portfolio manager', desc: 'I manage others\' capital' },
  { value: 'financial_advisor', label: 'Financial advisor', desc: 'I advise clients' },
  { value: 'analyst', label: 'Analyst / researcher', desc: 'I research markets' },
  { value: 'founder', label: 'Founder / entrepreneur', desc: 'I run a business' },
  { value: 'professional', label: 'Finance professional', desc: 'I work in finance' },
  { value: 'curious', label: 'Curious learner', desc: 'I want to understand markets' },
]

const NEWSLETTER_GOALS = [
  { value: 'daily_brief', label: 'Stay on top of my portfolio daily' },
  { value: 'opportunities', label: 'Spot investment opportunities' },
  { value: 'macro', label: 'Track macro trends and news' },
  { value: 'risk', label: 'Monitor risk in my holdings' },
  { value: 'client_prep', label: 'Prepare for client conversations' },
  { value: 'general', label: 'General market awareness' },
]

const READER_TOPICS = [
  'Macro', 'Equities', 'Fixed Income', 'Commodities', 'FX',
  'Central Banks', 'Geopolitics', 'Private Equity', 'Tech & AI', 'Crypto',
  'ESG', 'Earnings', 'IPOs', 'M&A', 'Real Estate',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555' }}>{title}</h2>
      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
        {children}
      </div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-white mb-2">{children}</label>
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-xs mb-3" style={{ color: '#666' }}>{children}</p>
}

export default function SettingsClient({
  userId, profile, products = 'digest', initialWatchlist, initialIndustries, initialRssFeeds,
}: {
  userId: string
  profile: any
  products?: string
  initialWatchlist: WatchlistItem[]
  initialIndustries: string[]
  initialRssFeeds: { id: string; label: string; url: string }[]
}) {
  const router = useRouter()
  const hasDigest = products === 'digest' || products === 'both'
  const hasReader = products === 'reader' || products === 'both'
  const [tab, setTab] = useState<'digest' | 'reader'>(hasDigest ? 'digest' : 'reader')

  const decoded = decodeFrequency(profile?.frequency)
  const [name, setName] = useState(profile?.name ?? '')
  const [dailyFreq, setDailyFreq] = useState(decoded.daily)
  const [weeklyDigest, setWeeklyDigest] = useState(decoded.weekly)
  const [digestTime, setDigestTime] = useState(profile?.digest_time ?? 'pre')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist)
  const [industries, setIndustries] = useState<string[]>(initialIndustries)
  const [customIndustry, setCustomIndustry] = useState('')
  const [preferredSources, setPreferredSources] = useState<string[]>(
    profile?.preferred_sources ? profile.preferred_sources.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  )
  const knownRoles = JOB_ROLES.map(r => r.value)
  const savedRole = profile?.job_role ?? ''
  const [jobRole, setJobRole] = useState(knownRoles.includes(savedRole) ? savedRole : (savedRole ? 'other' : ''))
  const [customJobRole, setCustomJobRole] = useState(knownRoles.includes(savedRole) ? '' : savedRole)
  const rawGoal = profile?.newsletter_goal ?? ''
  const [goalPart, extraPart] = rawGoal.includes(' — ') ? rawGoal.split(' — ') : [rawGoal, '']
  const [newsletterGoals, setNewsletterGoals] = useState<string[]>(
    goalPart ? goalPart.split(', ').map((g: string) => g.trim()).filter(Boolean) : []
  )
  const [extraContext, setExtraContext] = useState(extraPart ?? '')

  // Reader
  const [rssFeeds, setRssFeeds] = useState(initialRssFeeds)
  const [rssLabel, setRssLabel] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [rssAdding, setRssAdding] = useState(false)
  const [rssError, setRssError] = useState('')
  const [readerTopics, setReaderTopics] = useState<string[]>(
    profile?.extra_context ? profile.extra_context.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  )
  const [customReaderTopic, setCustomReaderTopic] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
      extra_context: readerTopics.join(', '),
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputCls = "w-full text-sm px-3 py-2.5 rounded-xl border outline-none bg-transparent text-white placeholder-zinc-600 transition-colors focus:border-zinc-500"
  const inputStyle = { borderColor: '#222' }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#fff', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b px-5 h-16" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1A1A1A' }}>
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
            <span className="font-extrabold text-lg text-white">brief</span>
          </Link>
          <Link href="/digest" className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:border-zinc-500"
            style={{ borderColor: '#1A1A1A', color: '#888' }}>
            ← Back
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-8">

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl p-1 mb-8 w-fit" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
          <button
            onClick={() => setTab('digest')}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'digest'
              ? { backgroundColor: '#1D9E75', color: '#fff' }
              : { color: '#666' }}
          >
            Digest
          </button>
          <button
            onClick={() => setTab('reader')}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'reader'
              ? { backgroundColor: '#2563EB', color: '#fff' }
              : { color: '#666' }}
          >
            Reader
          </button>
        </div>

        {/* ── DIGEST TAB ── */}
        {tab === 'digest' && (
          <div className="space-y-6">

            {!hasDigest && (
              <div className="rounded-2xl border p-6 text-center" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <p className="text-zinc-400 text-sm mb-4">You haven't set up Digest yet.</p>
                <Link href="/onboarding?product=digest&add=true"
                  className="inline-flex px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#1D9E75' }}>
                  Set up Digest →
                </Link>
              </div>
            )}

            {hasDigest && (
              <>
                <Section title="Profile">
                  <div>
                    <Label>Name</Label>
                    <input value={name} onChange={e => setName(e.target.value)} className={inputCls} style={inputStyle} />
                  </div>

                  <div>
                    <Label>Daily digest</Label>
                    <div className="flex gap-2">
                      {[{ value: 'daily', label: 'Once a day' }, { value: '2x', label: 'Twice a day' }, { value: 'none', label: 'No daily' }].map(opt => (
                        <button key={opt.value} onClick={() => setDailyFreq(opt.value)}
                          className="flex-1 py-2 rounded-lg text-sm border font-medium transition-colors"
                          style={dailyFreq === opt.value
                            ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                            : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#666' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-semibold text-white">Weekly summary</p>
                      <p className="text-xs" style={{ color: '#555' }}>A broader recap every Friday</p>
                    </div>
                    <button onClick={() => setWeeklyDigest(p => !p)}
                      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                      style={{ backgroundColor: weeklyDigest ? '#1D9E75' : '#333' }}>
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: weeklyDigest ? 'translateX(20px)' : 'none' }} />
                    </button>
                  </div>

                  {dailyFreq !== 'none' && (
                    <div>
                      <Label>Timing</Label>
                      <div className="flex gap-2">
                        {[{ value: 'pre', label: 'Pre-market' }, { value: 'eod', label: 'End of day' }, { value: 'both', label: 'Both' }].map(opt => (
                          <button key={opt.value} onClick={() => setDigestTime(opt.value)}
                            className="flex-1 py-2 rounded-lg text-sm border font-medium transition-colors"
                            style={digestTime === opt.value
                              ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                              : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#666' }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <SaveBtn saving={saving} saved={saved} onClick={saveProfile} />
                </Section>

                <Section title="About you">
                  <div>
                    <Label>What best describes you?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {JOB_ROLES.map(role => (
                        <button key={role.value} onClick={() => setJobRole(role.value)}
                          className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all"
                          style={jobRole === role.value
                            ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                            : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#aaa' }}>
                          <span className="text-sm font-semibold">{role.label}</span>
                          <span className="text-xs mt-0.5 opacity-60">{role.desc}</span>
                        </button>
                      ))}
                      <button onClick={() => setJobRole('other')}
                        className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all col-span-2"
                        style={jobRole === 'other'
                          ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                          : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#aaa' }}>
                        <span className="text-sm font-semibold">Other</span>
                        <span className="text-xs mt-0.5 opacity-60">My role isn't listed</span>
                      </button>
                    </div>
                    {jobRole === 'other' && (
                      <input value={customJobRole} onChange={e => setCustomJobRole(e.target.value)}
                        placeholder="Describe your role…"
                        className={`${inputCls} mt-3`} style={inputStyle} autoFocus />
                    )}
                  </div>

                  <div>
                    <Label>What are you looking for?</Label>
                    <Sub>Select all that apply</Sub>
                    <div className="space-y-2">
                      {NEWSLETTER_GOALS.map(goal => {
                        const sel = newsletterGoals.includes(goal.value)
                        return (
                          <button key={goal.value}
                            onClick={() => setNewsletterGoals(p => sel ? p.filter(g => g !== goal.value) : [...p, goal.value])}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium"
                            style={sel
                              ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                              : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#aaa' }}>
                            <span>{goal.label}</span>
                            {sel && <span className="text-white text-xs shrink-0">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Anything else? <span className="font-normal" style={{ color: '#555' }}>(optional)</span></Label>
                    <textarea value={extraContext} onChange={e => setExtraContext(e.target.value)}
                      placeholder="e.g. I focus on UK mid-cap stocks, I'm preparing for retirement…"
                      rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
                  </div>

                  <SaveBtn saving={saving} saved={saved} onClick={saveProfile} />
                </Section>

                <Section title="Watchlist">
                  <AssetSearch userId={userId} existing={watchlist}
                    onAdd={item => setWatchlist(p => [...p, item])}
                    onRemove={id => setWatchlist(p => p.filter(i => i.id !== id))} />
                </Section>

                <Section title="Industries">
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} onClick={() => toggleIndustry(ind)}
                        className="px-4 py-2 rounded-full text-sm border transition-colors font-medium"
                        style={industries.includes(ind)
                          ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                          : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#666' }}>
                        {ind}
                      </button>
                    ))}
                  </div>
                  {industries.filter(i => !INDUSTRIES.includes(i)).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {industries.filter(i => !INDUSTRIES.includes(i)).map(ind => (
                        <div key={ind} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border"
                          style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }}>
                          <span>{ind}</span>
                          <button onClick={() => removeCustomIndustry(ind)} className="opacity-70 hover:opacity-100 leading-none text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={customIndustry} onChange={e => setCustomIndustry(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomIndustry()}
                      placeholder="Add custom topic…"
                      className={inputCls} style={inputStyle} />
                    <button onClick={addCustomIndustry}
                      className="px-4 py-2.5 rounded-xl text-sm text-white font-semibold shrink-0"
                      style={{ backgroundColor: '#2563EB' }}>
                      Add
                    </button>
                  </div>
                </Section>

                <Section title="News sources">
                  <Sub>Industry news will only come from sources you select. Leave blank to use our default (Reuters, AP, BBC).</Sub>
                  <SourcePicker selected={preferredSources} onChange={setPreferredSources} />
                  <SaveBtn saving={saving} saved={saved} onClick={saveProfile} />
                </Section>
              </>
            )}

            <Section title="Account">
              <button onClick={signOut} className="text-sm font-medium" style={{ color: '#e53e3e' }}>
                Sign out
              </button>
            </Section>
          </div>
        )}

        {/* ── READER TAB ── */}
        {tab === 'reader' && (
          <div className="space-y-6">

            {!hasReader && (
              <div className="rounded-2xl border p-6 text-center" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <p className="text-zinc-400 text-sm mb-4">You haven't set up Reader yet.</p>
                <Link href="/onboarding?product=reader&add=true"
                  className="inline-flex px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#2563EB' }}>
                  Set up Reader →
                </Link>
              </div>
            )}

            {hasReader && (
              <>
                <Section title="Topics">
                  <Sub>Reader uses these to filter articles from your feeds — it only surfaces what's relevant to you.</Sub>
                  <div className="flex flex-wrap gap-2">
                    {READER_TOPICS.map(topic => {
                      const sel = readerTopics.includes(topic)
                      return (
                        <button key={topic}
                          onClick={() => setReaderTopics(p => sel ? p.filter(t => t !== topic) : [...p, topic])}
                          className="px-4 py-2 rounded-full text-sm border font-medium transition-colors"
                          style={sel
                            ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                            : { backgroundColor: '#1A1A1A', borderColor: '#222', color: '#666' }}>
                          {topic}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input value={customReaderTopic} onChange={e => setCustomReaderTopic(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customReaderTopic.trim()) {
                          setReaderTopics(p => p.includes(customReaderTopic.trim()) ? p : [...p, customReaderTopic.trim()])
                          setCustomReaderTopic('')
                        }
                      }}
                      placeholder="Add custom topic (e.g. Oil markets, UK gilts…)"
                      className={inputCls} style={inputStyle} />
                    <button
                      onClick={() => {
                        if (customReaderTopic.trim()) {
                          setReaderTopics(p => p.includes(customReaderTopic.trim()) ? p : [...p, customReaderTopic.trim()])
                          setCustomReaderTopic('')
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm text-white font-semibold shrink-0"
                      style={{ backgroundColor: '#2563EB' }}>
                      Add
                    </button>
                  </div>
                  <SaveBtn saving={saving} saved={saved} onClick={saveProfile} color="#2563EB" />
                </Section>

                <Section title="Subscriptions">
                  <Sub>Paste the RSS feed URL from any publication you already subscribe to.</Sub>

                  {rssFeeds.length > 0 && (
                    <div className="space-y-2">
                      {rssFeeds.map(feed => (
                        <div key={feed.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
                          style={{ borderColor: '#222', backgroundColor: '#1A1A1A' }}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{feed.label}</p>
                            <p className="text-xs truncate" style={{ color: '#555' }}>{feed.url}</p>
                          </div>
                          <button onClick={() => removeRssFeed(feed.id)}
                            className="text-xs font-medium shrink-0 transition-colors hover:opacity-80"
                            style={{ color: '#e53e3e' }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <input value={rssLabel} onChange={e => setRssLabel(e.target.value)}
                      placeholder="Publication name (e.g. Financial Times)"
                      className={inputCls} style={inputStyle} />
                    <input value={rssUrl} onChange={e => setRssUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addRssFeed()}
                      placeholder="RSS URL (e.g. https://www.ft.com/rss/home/…)"
                      className={inputCls} style={inputStyle} />
                    {rssError && <p className="text-xs" style={{ color: '#e53e3e' }}>{rssError}</p>}
                    <button onClick={addRssFeed}
                      disabled={rssAdding || !rssLabel.trim() || !rssUrl.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                      style={{ backgroundColor: '#2563EB' }}>
                      {rssAdding ? 'Adding…' : '+ Add feed'}
                    </button>
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold list-none flex items-center gap-1.5 select-none" style={{ color: '#2563EB' }}>
                      <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                      How to find your RSS URL
                    </summary>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed pl-5 border-l-2" style={{ borderColor: '#2563EB33', color: '#666' }}>
                      <div>
                        <p className="font-semibold text-white">Financial Times</p>
                        <p>Log in → click your name → My FT → Manage alerts → find the RSS icon. Or go to <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#888' }}>ft.com/myft/following</code>.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">The Economist</p>
                        <p>Log in → go to <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#888' }}>economist.com/rss</code> → copy any feed URL.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Wall Street Journal</p>
                        <p>Log in → go to <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A', color: '#888' }}>wsj.com/news/rss-news-and-feeds</code> → select a feed.</p>
                      </div>
                      <p className="text-xs" style={{ color: '#444' }}>Your RSS URL may contain a private token — treat it like a password. We never share it.</p>
                    </div>
                  </details>
                </Section>
              </>
            )}

            <Section title="Account">
              <button onClick={signOut} className="text-sm font-medium" style={{ color: '#e53e3e' }}>
                Sign out
              </button>
            </Section>
          </div>
        )}

      </div>
    </div>
  )
}

function SaveBtn({ saving, saved, onClick, color = '#1D9E75' }: { saving: boolean; saved: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
      style={{ backgroundColor: saved ? '#1D9E75' : color }}>
      {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
    </button>
  )
}
