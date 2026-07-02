'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AssetSearch from './AssetSearch'
import type { AssetType, WatchlistItem } from '@/types'

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

const POPULAR_PICKS: { category: string; items: { ticker: string; name: string; assetType: AssetType }[] }[] = [
  { category: 'US Stocks', items: [
    { ticker: 'AAPL',  name: 'Apple',     assetType: 'stock' },
    { ticker: 'MSFT',  name: 'Microsoft', assetType: 'stock' },
    { ticker: 'GOOGL', name: 'Alphabet',  assetType: 'stock' },
    { ticker: 'AMZN',  name: 'Amazon',    assetType: 'stock' },
    { ticker: 'NVDA',  name: 'Nvidia',    assetType: 'stock' },
    { ticker: 'TSLA',  name: 'Tesla',     assetType: 'stock' },
    { ticker: 'META',  name: 'Meta',      assetType: 'stock' },
    { ticker: 'NFLX',  name: 'Netflix',   assetType: 'stock' },
    { ticker: 'JPM',   name: 'JPMorgan',  assetType: 'stock' },
    { ticker: 'V',     name: 'Visa',      assetType: 'stock' },
  ]},
  { category: 'European Stocks', items: [
    { ticker: 'SHEL.L',  name: 'Shell',       assetType: 'stock' },
    { ticker: 'AZN.L',   name: 'AstraZeneca', assetType: 'stock' },
    { ticker: 'HSBA.L',  name: 'HSBC',        assetType: 'stock' },
    { ticker: 'BP.L',    name: 'BP',          assetType: 'stock' },
    { ticker: 'MC.PA',   name: 'LVMH',        assetType: 'stock' },
    { ticker: 'AIR.PA',  name: 'Airbus',      assetType: 'stock' },
    { ticker: 'SAP.DE',  name: 'SAP',         assetType: 'stock' },
    { ticker: 'ASML.AS', name: 'ASML',        assetType: 'stock' },
  ]},
  { category: 'ETFs', items: [
    { ticker: 'SPY',    name: 'S&P 500 ETF',      assetType: 'etf' },
    { ticker: 'QQQ',    name: 'Nasdaq 100 ETF',    assetType: 'etf' },
    { ticker: 'VOO',    name: 'Vanguard S&P 500',  assetType: 'etf' },
    { ticker: 'GLD',    name: 'SPDR Gold',         assetType: 'etf' },
    { ticker: 'VUSA.L', name: 'Vanguard S&P (LSE)', assetType: 'etf' },
    { ticker: 'ISF.L',  name: 'FTSE 100 ETF',      assetType: 'etf' },
  ]},
  { category: 'Crypto & Commodities', items: [
    { ticker: 'BTC-USD', name: 'Bitcoin',   assetType: 'crypto' },
    { ticker: 'ETH-USD', name: 'Ethereum',  assetType: 'crypto' },
    { ticker: 'SOL-USD', name: 'Solana',    assetType: 'crypto' },
    { ticker: 'GC=F',    name: 'Gold',      assetType: 'commodity' },
    { ticker: 'CL=F',    name: 'Crude Oil', assetType: 'commodity' },
  ]},
]

// Digest: Welcome(0) Role(1) Goals(2) Watchlist(3) Industries(4) Preferences(5) Review(6)
const DIGEST_STEPS = ['Welcome', 'Your role', 'Your goals', 'Watchlist', 'Industries', 'Preferences', 'Review']
// Reader: Welcome(0) Interests(1) Subscriptions(2) About you(3) Preferences(4) Review(5)
const READER_STEPS = ['Welcome', 'Your interests', 'Subscriptions', 'About you', 'Preferences', 'Review']

const RSS_GUIDES = [
  { name: 'Financial Times', url: 'https://www.ft.com/myft/alerts', instructions: 'Sign in to ft.com, go to myFT > Alerts, and copy the RSS feed URL for any topic or section you follow.' },
  { name: 'The Economist', url: 'https://www.economist.com/rss', instructions: 'Visit economist.com/rss to see all available feeds. Copy the URL for your preferred sections (Finance, Leaders, etc.).' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com/feeds', instructions: 'Bloomberg offers limited public RSS. Use a third-party RSS bridge for full articles or try their podcast feeds.' },
  { name: 'Wall Street Journal', url: 'https://www.wsj.com/news/rss-news-and-feeds', instructions: 'Visit wsj.com/news/rss-news-and-feeds and copy the XML feed URL for any section (Markets, Business, Tech).' },
  { name: 'Reuters', url: 'https://www.reuters.com/tools/rss', instructions: 'Visit reuters.com/tools/rss. Copy the feed URL for Business, Markets, or any topic you follow.' },
]

const READER_TOPICS = [
  'Macro / Global economy', 'Central bank policy', 'Equities / Stock markets',
  'Fixed income / Bonds', 'Commodities', 'Currencies / FX',
  'Private equity', 'Venture capital', 'Real estate',
  'Technology', 'Energy transition', 'ESG / Sustainability',
  'Regulation / Policy', 'M&A / Deals', 'Emerging markets',
]

// Shared style helpers
const accent = (product: string) => product === 'reader' ? '#2563EB' : '#1D9E75'
const accentBg = (product: string) => product === 'reader' ? 'rgba(37,99,235,0.12)' : 'rgba(29,158,117,0.12)'
const accentBorder = (product: string) => product === 'reader' ? 'rgba(37,99,235,0.3)' : 'rgba(29,158,117,0.3)'

export default function OnboardingFlow({ userId, product = 'digest', isAdding = false, existingName = '' }: { userId: string; product?: 'digest' | 'reader'; isAdding?: boolean; existingName?: string }) {
  const router = useRouter()
  const STEPS = product === 'reader' ? READER_STEPS : DIGEST_STEPS
  const [step, setStep] = useState(isAdding ? 1 : 0)
  const [name, setName] = useState(existingName)

  // Digest state
  const [jobRole, setJobRole] = useState('')
  const [customJobRole, setCustomJobRole] = useState('')
  const [newsletterGoals, setNewsletterGoals] = useState<string[]>([])
  const [extraContext, setExtraContext] = useState('')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [customIndustry, setCustomIndustry] = useState('')
  const [dailyFreq, setDailyFreq] = useState('daily')
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [digestTime, setDigestTime] = useState('pre')

  // Reader state
  const [readerTopics, setReaderTopics] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [readerFeeds, setReaderFeeds] = useState<{ label: string; url: string }[]>([])
  const [feedUrl, setFeedUrl] = useState('')
  const [feedLabel, setFeedLabel] = useState('')
  const [feedError, setFeedError] = useState('')
  const [guideInputs, setGuideInputs] = useState<Record<string, string>>({})
  const [readerAbout, setReaderAbout] = useState('')
  const [readerFreq, setReaderFreq] = useState('daily')
  const [showGuide, setShowGuide] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const col = accent(product)
  const colBg = accentBg(product)
  const colBorder = accentBorder(product)

  const toggleIndustry = (label: string) =>
    setSelectedIndustries(prev => prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label])

  const addCustomIndustry = () => {
    const trimmed = customIndustry.trim()
    if (trimmed && !selectedIndustries.includes(trimmed)) {
      setSelectedIndustries(prev => [...prev, trimmed])
      setCustomIndustry('')
    }
  }

  const addFeed = () => {
    const url = feedUrl.trim()
    const label = feedLabel.trim()
    if (!url) { setFeedError('Please enter a URL'); return }
    if (!label) { setFeedError('Please give this feed a name'); return }
    try { new URL(url) } catch { setFeedError("That doesn't look like a valid URL"); return }
    if (readerFeeds.some(f => f.url === url)) { setFeedError('Already added'); return }
    setReaderFeeds(prev => [...prev, { label, url }])
    setFeedUrl(''); setFeedLabel(''); setFeedError('')
  }

  const finish = async () => {
    setSaving(true)

    if (product === 'reader') {
      await supabase.from('profiles').update({
        name,
        products: isAdding ? 'both' : 'reader',
        frequency: readerFreq,
        newsletter_goal: readerTopics.join(', '),
        extra_context: readerAbout,
      }).eq('id', userId)

      if (readerFeeds.length > 0) {
        await supabase.from('rss_feeds').insert(
          readerFeeds.map(f => ({ user_id: userId, label: f.label, url: f.url }))
        )
      }
    } else {
      await supabase.from('profiles').update({
        name,
        products: isAdding ? 'both' : 'digest',
        frequency: weeklyDigest ? (dailyFreq === 'none' ? 'weekly' : `${dailyFreq}+weekly`) : dailyFreq,
        digest_time: digestTime,
        job_role: jobRole === 'other' ? customJobRole : jobRole,
        newsletter_goal: newsletterGoals.join(', ') + (extraContext ? ` — ${extraContext}` : ''),
      }).eq('id', userId)

      if (selectedIndustries.length > 0) {
        await supabase.from('followed_industries').insert(
          selectedIndustries.map(label => ({ user_id: userId, label }))
        )
      }

      if (watchlist.length > 0) {
        await supabase.from('watchlist_items').insert(
          watchlist.map(w => ({ user_id: userId, ticker: w.ticker, name: w.name, asset_type: w.assetType }))
        )
      }
    }

    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, product }),
    }).catch(() => {})

    setSaving(false)
    router.push(isAdding ? '/digest?tab=reader' : product === 'reader' ? '/reader' : '/digest')
  }

  // Shared UI helpers
  const Btn = ({ onClick, disabled, children, secondary }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; secondary?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-40"
      style={secondary
        ? { backgroundColor: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A' }
        : { backgroundColor: col, color: '#fff' }
      }
    >
      {children}
    </button>
  )

  const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-sm border transition-all"
      style={selected
        ? { backgroundColor: col, borderColor: col, color: '#fff' }
        : { backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#888' }
      }
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-0.5 mb-8">
          <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
          <span className="font-extrabold text-lg text-white">brief</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-colors duration-300"
              style={{ backgroundColor: i <= step ? col : '#222' }} />
          ))}
        </div>

        {/* Step label */}
        <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: col }}>
          {product === 'reader' ? 'Reader' : 'Digest'} · {STEPS[step]}
        </p>

        {/* ───── STEP 0: WELCOME ───── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {product === 'reader' ? 'Set up your Reader' : 'Set up your Digest'}
              </h1>
              <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                {product === 'reader'
                  ? 'Connect your newsletters and we\'ll filter every article down to what actually matters to you.'
                  : 'Build your watchlist and we\'ll write a personalised briefing around what you hold.'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Your first name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex"
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#111', border: '1px solid #222' }}
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)}
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-opacity hover:opacity-85"
              style={{ backgroundColor: col }}
            >
              Get started
            </button>
          </div>
        )}

        {/* ═══════════ READER STEPS ═══════════ */}

        {/* Reader Step 1: Interests */}
        {product === 'reader' && step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">What topics matter to you, {name}?</h2>
              <p className="text-zinc-400 mt-1 text-sm">We'll filter every article through these — only what's relevant lands in your inbox.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {READER_TOPICS.map(topic => (
                <Chip key={topic} label={topic} selected={readerTopics.includes(topic)}
                  onClick={() => setReaderTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])} />
              ))}
              {/* Custom topics */}
              {readerTopics.filter(t => !READER_TOPICS.includes(t)).map(t => (
                <div key={t} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border"
                  style={{ backgroundColor: col, borderColor: col, color: '#fff' }}>
                  <span>{t}</span>
                  <button onClick={() => setReaderTopics(prev => prev.filter(x => x !== t))} className="opacity-70 hover:opacity-100 leading-none">✕</button>
                </div>
              ))}
            </div>
            {/* Add custom topic */}
            <div className="flex gap-2">
              <input
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customTopic.trim()) {
                    setReaderTopics(prev => [...prev, customTopic.trim()])
                    setCustomTopic('')
                  }
                }}
                placeholder="Add your own topic (e.g. French equities, Biotech, Fintech…)"
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222' }}
              />
              <button
                onClick={() => { if (customTopic.trim()) { setReaderTopics(prev => [...prev, customTopic.trim()]); setCustomTopic('') } }}
                className="px-5 py-3 rounded-xl text-sm text-white font-semibold"
                style={{ backgroundColor: col }}
              >
                Add
              </button>
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(0)}>Back</Btn>
              <Btn onClick={() => setStep(2)} disabled={readerTopics.length === 0}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Reader Step 2: Subscriptions */}
        {product === 'reader' && step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Connect your subscriptions</h2>
              <p className="text-zinc-400 mt-1 text-sm">Paste the RSS URL from any publication you subscribe to. Not sure where to find it? Use the guides below.</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Find your RSS link</p>
              {RSS_GUIDES.map(guide => {
                const alreadyAdded = readerFeeds.some(f => f.label === guide.name)
                return (
                  <div key={guide.name}>
                    <button
                      onClick={() => setShowGuide(showGuide === guide.name ? null : guide.name)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#111', border: `1px solid ${alreadyAdded ? col + '44' : '#222'}`, color: '#ccc' }}
                    >
                      <div className="flex items-center gap-2">
                        {alreadyAdded && <span className="text-xs font-bold" style={{ color: col }}>✓</span>}
                        <span>{guide.name}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{showGuide === guide.name ? 'Hide' : alreadyAdded ? 'Added' : 'Connect'}</span>
                    </button>
                    {showGuide === guide.name && (
                      <div className="mx-1 mt-1 mb-2 px-4 py-4 rounded-xl space-y-3" style={{ backgroundColor: '#0D0D0D', border: '1px solid #1A1A1A' }}>
                        <p className="text-xs text-zinc-400 leading-relaxed">{guide.instructions}</p>
                        <a href={guide.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: col }}>
                          Open {guide.name} page →
                        </a>
                        <div className="pt-1">
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Paste your RSS URL</p>
                          <div className="flex gap-2">
                            <input
                              value={guideInputs[guide.name] ?? ''}
                              onChange={e => setGuideInputs(prev => ({ ...prev, [guide.name]: e.target.value }))}
                              placeholder={`Paste ${guide.name} RSS URL here`}
                              className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                              style={{ backgroundColor: '#111', border: '1px solid #2A2A2A' }}
                            />
                            <button
                              onClick={() => {
                                const url = (guideInputs[guide.name] ?? '').trim()
                                if (!url) return
                                try { new URL(url) } catch { return }
                                if (!readerFeeds.some(f => f.url === url)) {
                                  setReaderFeeds(prev => [...prev, { label: guide.name, url }])
                                }
                                setGuideInputs(prev => ({ ...prev, [guide.name]: '' }))
                                setShowGuide(null)
                              }}
                              className="px-4 py-2.5 rounded-xl text-sm text-white font-semibold shrink-0"
                              style={{ backgroundColor: col }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Add a feed</p>
              <input value={feedLabel} onChange={e => setFeedLabel(e.target.value)} placeholder="Name (e.g. FT Markets)"
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222' }} />
              <div className="flex gap-2">
                <input value={feedUrl} onChange={e => { setFeedUrl(e.target.value); setFeedError('') }}
                  placeholder="Paste RSS feed URL"
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ backgroundColor: '#111', border: '1px solid #222' }} />
                <button onClick={addFeed} className="px-5 py-3 rounded-xl text-sm text-white font-semibold" style={{ backgroundColor: col }}>
                  Add
                </button>
              </div>
              {feedError && <p className="text-xs text-red-400">{feedError}</p>}
            </div>

            {readerFeeds.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Added ({readerFeeds.length})</p>
                {readerFeeds.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #222' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{f.label}</p>
                      <p className="text-xs text-zinc-500 truncate">{f.url}</p>
                    </div>
                    <button onClick={() => setReaderFeeds(prev => prev.filter((_, j) => j !== i))} className="text-xs text-zinc-500 hover:text-red-400 ml-3 shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(1)}>Back</Btn>
              <Btn onClick={() => setStep(3)}>
                {readerFeeds.length === 0 ? 'Skip for now' : `Continue (${readerFeeds.length})`}
              </Btn>
            </div>
          </div>
        )}

        {/* Reader Step 3: About you */}
        {product === 'reader' && step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Tell us a bit about yourself</h2>
              <p className="text-zinc-400 mt-1 text-sm leading-relaxed">
                The more context you give, the better Finbrief can filter and explain what matters to you. This is optional but makes a big difference.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'I manage a portfolio focused on European equities and macro trends.',
                'I work in private equity and care about deals, valuations, and credit markets.',
                'I\'m a retail investor tracking US tech stocks and crypto.',
                'I\'m a financial advisor preparing for client meetings each morning.',
              ].map(eg => (
                <button key={eg} onClick={() => setReaderAbout(eg)}
                  className="w-full text-left px-4 py-3 rounded-xl text-xs text-zinc-400 transition-colors hover:text-white"
                  style={{ backgroundColor: '#111', border: `1px solid ${readerAbout === eg ? col : '#222'}` }}>
                  "{eg}"
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Or write your own</label>
              <textarea
                value={readerAbout}
                onChange={e => setReaderAbout(e.target.value)}
                placeholder="Describe your background, what you invest in, what decisions you make day-to-day…"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222' }}
              />
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(2)}>Back</Btn>
              <Btn onClick={() => setStep(4)}>
                {readerAbout.trim() ? 'Continue' : 'Skip for now'}
              </Btn>
            </div>
          </div>
        )}

        {/* Reader Step 4: Preferences */}
        {product === 'reader' && step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">How often should we send it?</h2>
              <p className="text-zinc-400 mt-1 text-sm">Your curated read, delivered on your schedule.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: 'daily', label: 'Every morning' }, { value: '2x', label: 'Twice daily' }, { value: 'weekly', label: 'Weekly' }].map(opt => (
                <button key={opt.value} onClick={() => setReaderFreq(opt.value)}
                  className="py-3.5 rounded-xl text-sm font-medium border transition-all"
                  style={readerFreq === opt.value
                    ? { backgroundColor: col, borderColor: col, color: '#fff' }
                    : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(3)}>Back</Btn>
              <Btn onClick={() => setStep(5)}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Reader Step 5: Review */}
        {product === 'reader' && step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Ready to go, {name}</h2>
              <p className="text-zinc-400 mt-1 text-sm">Tap any section to edit before we launch.</p>
            </div>

            {[
              { label: 'Topics', goTo: 1, content: readerTopics.length > 0
                ? <div className="flex flex-wrap gap-1.5 mt-1">{readerTopics.map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: colBg, color: col }}>{t}</span>)}</div>
                : <p className="text-sm text-zinc-500 mt-1">None selected</p> },
              { label: 'Subscriptions', goTo: 2, content: readerFeeds.length > 0
                ? <div className="flex flex-wrap gap-1.5 mt-1">{readerFeeds.map(f => <span key={f.url} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#1A1A1A', color: '#ccc' }}>{f.label}</span>)}</div>
                : <p className="text-sm text-zinc-500 mt-1">No feeds yet — add later in Settings</p> },
              { label: 'About you', goTo: 3, content: <p className="text-sm text-zinc-300 mt-1">{readerAbout || <span className="text-zinc-500">Not set</span>}</p> },
              { label: 'Delivery', goTo: 4, content: <p className="text-sm text-zinc-300 mt-1">{readerFreq === 'daily' ? 'Every morning' : readerFreq === '2x' ? 'Twice daily' : 'Weekly'}</p> },
            ].map(row => (
              <button key={row.label} onClick={() => setStep(row.goTo)}
                className="w-full text-left p-4 rounded-xl border transition-colors"
                style={{ backgroundColor: '#111', borderColor: '#222' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{row.label}</span>
                  <span className="text-xs font-medium" style={{ color: col }}>Edit</span>
                </div>
                {row.content}
              </button>
            ))}

            <div className="flex gap-3 pt-2">
              <Btn secondary onClick={() => setStep(4)}>Back</Btn>
              <Btn onClick={finish} disabled={saving}>{saving ? 'Setting up...' : 'Launch my Reader'}</Btn>
            </div>
          </div>
        )}

        {/* ═══════════ DIGEST STEPS ═══════════ */}

        {/* Digest Step 1: Role */}
        {product === 'digest' && step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">What best describes you, {name}?</h2>
              <p className="text-zinc-400 mt-1 text-sm">Helps Claude tailor the depth and focus of your digest.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {JOB_ROLES.map(role => (
                <button key={role.value} onClick={() => setJobRole(role.value)}
                  className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all"
                  style={jobRole === role.value
                    ? { backgroundColor: col, borderColor: col, color: '#fff' }
                    : { backgroundColor: '#111', borderColor: '#222', color: '#ccc' }}>
                  <span className="text-sm font-semibold">{role.label}</span>
                  <span className="text-xs mt-0.5 opacity-60">{role.desc}</span>
                </button>
              ))}
              <button onClick={() => setJobRole('other')}
                className="flex flex-col items-start px-4 py-3 rounded-xl border text-left col-span-2 transition-all"
                style={jobRole === 'other'
                  ? { backgroundColor: col, borderColor: col, color: '#fff' }
                  : { backgroundColor: '#111', borderColor: '#222', color: '#ccc' }}>
                <span className="text-sm font-semibold">Other</span>
                <span className="text-xs mt-0.5 opacity-60">My role isn't listed</span>
              </button>
            </div>
            {jobRole === 'other' && (
              <input value={customJobRole} onChange={e => setCustomJobRole(e.target.value)}
                placeholder="Describe your role…"
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #333' }} autoFocus />
            )}
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(0)}>Back</Btn>
              <Btn onClick={() => setStep(2)} disabled={!jobRole || (jobRole === 'other' && !customJobRole.trim())}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Digest Step 2: Goals */}
        {product === 'digest' && step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">What do you want from Finbrief?</h2>
              <p className="text-zinc-400 mt-1 text-sm">Select all that apply — shapes what Claude focuses on.</p>
            </div>
            <div className="space-y-2">
              {NEWSLETTER_GOALS.map(goal => {
                const selected = newsletterGoals.includes(goal.value)
                return (
                  <button key={goal.value}
                    onClick={() => setNewsletterGoals(prev => selected ? prev.filter(g => g !== goal.value) : [...prev, goal.value])}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all"
                    style={selected
                      ? { backgroundColor: col, borderColor: col, color: '#fff' }
                      : { backgroundColor: '#111', borderColor: '#222', color: '#ccc' }}>
                    <span>{goal.label}</span>
                    {selected && <span className="text-white text-xs shrink-0">✓</span>}
                  </button>
                )
              })}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Anything else? <span className="normal-case">(optional)</span></label>
              <textarea value={extraContext} onChange={e => setExtraContext(e.target.value)}
                placeholder="e.g. I focus on UK mid-caps, preparing for retirement, managing a family office…"
                rows={2}
                className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222' }} />
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(1)}>Back</Btn>
              <Btn onClick={() => setStep(3)} disabled={newsletterGoals.length === 0}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Digest Step 3: Watchlist */}
        {product === 'digest' && step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Build your watchlist</h2>
              <p className="text-zinc-400 mt-1 text-sm">Tap to add, tap again to remove. Search for anything else below.</p>
            </div>
            {POPULAR_PICKS.map(group => (
              <div key={group.category}>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(stock => {
                    const added = watchlist.some(w => w.ticker === stock.ticker)
                    return (
                      <button key={stock.ticker}
                        onClick={() => added
                          ? setWatchlist(prev => prev.filter(w => w.ticker !== stock.ticker))
                          : setWatchlist(prev => [...prev, { id: `quick-${stock.ticker}`, ...stock }])}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                        style={added
                          ? { backgroundColor: col, borderColor: col, color: '#fff' }
                          : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}>
                        {added ? '✓ ' : ''}{stock.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Search for more</p>
              <AssetSearch userId={userId} existing={watchlist}
                onAdd={item => setWatchlist(prev => [...prev, item])}
                onRemove={id => setWatchlist(prev => prev.filter(i => i.id !== id))} />
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(2)}>Back</Btn>
              <Btn onClick={() => setStep(4)}>
                {watchlist.length === 0 ? 'Skip for now' : `Continue (${watchlist.length})`}
              </Btn>
            </div>
          </div>
        )}

        {/* Digest Step 4: Industries */}
        {product === 'digest' && step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Follow industries</h2>
              <p className="text-zinc-400 mt-1 text-sm">We'll pull relevant sector news into every digest.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(ind => (
                <Chip key={ind} label={ind} selected={selectedIndustries.includes(ind)} onClick={() => toggleIndustry(ind)} />
              ))}
            </div>
            {selectedIndustries.filter(i => !INDUSTRIES.includes(i)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedIndustries.filter(i => !INDUSTRIES.includes(i)).map(ind => (
                  <div key={ind} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: col, color: '#fff' }}>
                    <span>{ind}</span>
                    <button onClick={() => setSelectedIndustries(prev => prev.filter(i => i !== ind))} className="opacity-70 hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={customIndustry} onChange={e => setCustomIndustry(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomIndustry()}
                placeholder="Add custom topic (e.g. Space, Luxury goods…)"
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                style={{ backgroundColor: '#111', border: '1px solid #222' }} />
              <button onClick={addCustomIndustry} className="px-5 py-3 rounded-xl text-sm text-white font-semibold" style={{ backgroundColor: col }}>
                Add
              </button>
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(3)}>Back</Btn>
              <Btn onClick={() => setStep(5)}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Digest Step 5: Preferences */}
        {product === 'digest' && step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Delivery preferences</h2>
              <p className="text-zinc-400 mt-1 text-sm">When do you want your digest?</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Daily frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 'daily', label: 'Once a day' }, { value: '2x', label: 'Twice a day' }, { value: 'none', label: 'No daily' }].map(opt => (
                  <button key={opt.value} onClick={() => setDailyFreq(opt.value)}
                    className="py-3 rounded-xl text-sm font-medium border transition-all"
                    style={dailyFreq === opt.value
                      ? { backgroundColor: col, borderColor: col, color: '#fff' }
                      : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {dailyFreq !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Timing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'pre', label: 'Pre-market' }, { value: 'eod', label: 'End of day' }, { value: 'both', label: 'Both' }].map(opt => (
                    <button key={opt.value} onClick={() => setDigestTime(opt.value)}
                      className="py-3 rounded-xl text-sm font-medium border transition-all"
                      style={digestTime === opt.value
                        ? { backgroundColor: col, borderColor: col, color: '#fff' }
                        : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-2 px-4 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #222' }}>
              <div>
                <p className="text-sm font-medium text-white">Weekly summary</p>
                <p className="text-xs text-zinc-500">A broader recap every Friday</p>
              </div>
              <button onClick={() => setWeeklyDigest(prev => !prev)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ backgroundColor: weeklyDigest ? col : '#2A2A2A' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: weeklyDigest ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
            <div className="flex gap-3">
              <Btn secondary onClick={() => setStep(4)}>Back</Btn>
              <Btn onClick={() => setStep(6)}>Continue</Btn>
            </div>
          </div>
        )}

        {/* Digest Step 6: Review */}
        {product === 'digest' && step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Ready to go, {name}</h2>
              <p className="text-zinc-400 mt-1 text-sm">Tap any section to edit before we launch.</p>
            </div>

            {[
              { label: 'Your role', goTo: 1, content: <p className="text-sm text-zinc-300 mt-1">{jobRole === 'other' ? customJobRole : JOB_ROLES.find(r => r.value === jobRole)?.label ?? 'Not set'}</p> },
              { label: 'Your goals', goTo: 2, content: <div className="flex flex-wrap gap-1.5 mt-1">{newsletterGoals.map(g => <span key={g} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: colBg, color: col }}>{NEWSLETTER_GOALS.find(ng => ng.value === g)?.label ?? g}</span>)}{extraContext && <p className="text-xs text-zinc-500 w-full mt-1 italic">"{extraContext}"</p>}</div> },
              { label: 'Watchlist', goTo: 3, content: watchlist.length > 0
                ? <div className="flex flex-wrap gap-1.5 mt-1">{watchlist.map(w => <span key={w.ticker} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#1A1A1A', color: '#ccc' }}>{w.name}</span>)}</div>
                : <p className="text-sm text-zinc-500 mt-1">None yet — add later</p> },
              { label: 'Industries', goTo: 4, content: selectedIndustries.length > 0
                ? <div className="flex flex-wrap gap-1.5 mt-1">{selectedIndustries.map(ind => <span key={ind} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#1A1A1A', color: '#ccc' }}>{ind}</span>)}</div>
                : <p className="text-sm text-zinc-500 mt-1">None selected</p> },
              { label: 'Delivery', goTo: 5, content: <p className="text-sm text-zinc-300 mt-1">{dailyFreq === 'none' ? 'No daily' : dailyFreq === '2x' ? 'Twice daily' : 'Once daily'} — {digestTime === 'pre' ? 'Pre-market' : digestTime === 'eod' ? 'End of day' : 'Both'}{weeklyDigest ? ' + Weekly' : ''}</p> },
            ].map(row => (
              <button key={row.label} onClick={() => setStep(row.goTo)}
                className="w-full text-left p-4 rounded-xl border transition-colors hover:border-zinc-600"
                style={{ backgroundColor: '#111', borderColor: '#222' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{row.label}</span>
                  <span className="text-xs font-medium" style={{ color: col }}>Edit</span>
                </div>
                {row.content}
              </button>
            ))}

            <div className="flex gap-3 pt-2">
              <Btn secondary onClick={() => setStep(5)}>Back</Btn>
              <Btn onClick={finish} disabled={saving}>{saving ? 'Setting up...' : 'Launch my Digest'}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
