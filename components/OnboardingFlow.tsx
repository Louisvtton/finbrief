'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AssetSearch from './AssetSearch'
import SourcePicker from './SourcePicker'
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
    { ticker: 'SHEL.L',  name: 'Shell',         assetType: 'stock' },
    { ticker: 'AZN.L',   name: 'AstraZeneca',   assetType: 'stock' },
    { ticker: 'HSBA.L',  name: 'HSBC',          assetType: 'stock' },
    { ticker: 'BP.L',    name: 'BP',            assetType: 'stock' },
    { ticker: 'BARC.L',  name: 'Barclays',      assetType: 'stock' },
    { ticker: 'MC.PA',   name: 'LVMH',          assetType: 'stock' },
    { ticker: 'AIR.PA',  name: 'Airbus',        assetType: 'stock' },
    { ticker: 'SAP.DE',  name: 'SAP',           assetType: 'stock' },
    { ticker: 'ASML.AS', name: 'ASML',          assetType: 'stock' },
    { ticker: 'NESN.SW', name: 'Nestlé',        assetType: 'stock' },
  ]},
  { category: 'ETFs', items: [
    { ticker: 'SPY',     name: 'S&P 500 ETF',       assetType: 'etf' },
    { ticker: 'QQQ',     name: 'Nasdaq 100 ETF',     assetType: 'etf' },
    { ticker: 'VOO',     name: 'Vanguard S&P 500',   assetType: 'etf' },
    { ticker: 'VTI',     name: 'Total Stock Market',  assetType: 'etf' },
    { ticker: 'ARKK',    name: 'ARK Innovation',      assetType: 'etf' },
    { ticker: 'GLD',     name: 'SPDR Gold',           assetType: 'etf' },
    { ticker: 'VUSA.L',  name: 'Vanguard S&P 500 (LSE)', assetType: 'etf' },
    { ticker: 'ISF.L',   name: 'FTSE 100 ETF (LSE)',  assetType: 'etf' },
  ]},
  { category: 'Crypto & Commodities', items: [
    { ticker: 'BTC-USD', name: 'Bitcoin',   assetType: 'crypto' },
    { ticker: 'ETH-USD', name: 'Ethereum',  assetType: 'crypto' },
    { ticker: 'SOL-USD', name: 'Solana',    assetType: 'crypto' },
    { ticker: 'GC=F',    name: 'Gold',      assetType: 'commodity' },
    { ticker: 'CL=F',    name: 'Crude Oil', assetType: 'commodity' },
    { ticker: 'SI=F',    name: 'Silver',    assetType: 'commodity' },
  ]},
]

const DIGEST_STEPS = ['Welcome', 'Your role', 'Your goals', 'Watchlist', 'Industries', 'News sources', 'Preferences', 'Review']
const READER_STEPS = ['Welcome', 'Your interests', 'Subscriptions', 'Preferences', 'Review']

const RSS_GUIDES: { name: string; url: string; instructions: string }[] = [
  { name: 'Financial Times', url: 'https://www.ft.com/myft/alerts', instructions: 'Sign in to ft.com, go to myFT > Alerts, and copy the RSS feed URL for any topic or section you follow.' },
  { name: 'The Economist', url: 'https://www.economist.com/rss', instructions: 'Visit economist.com/rss to see all available feeds. Copy the URL for your preferred sections (e.g. Finance, Britain, Leaders).' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com/feeds', instructions: 'Bloomberg offers limited public RSS. Try bloomberg.com/feed/podcast for audio, or use a third-party RSS bridge for full articles.' },
  { name: 'Wall Street Journal', url: 'https://www.wsj.com/news/rss-news-and-feeds', instructions: 'Visit wsj.com/news/rss-news-and-feeds. Copy the XML feed URL for any section (Markets, Business, Tech, Opinion).' },
  { name: 'Reuters', url: 'https://www.reuters.com/tools/rss', instructions: 'Visit reuters.com/tools/rss to see all section feeds. Copy the feed URL for Business, Markets, or any topic.' },
]

const READER_TOPICS = [
  'Macro / Global economy', 'Central bank policy', 'Equities / Stock markets',
  'Fixed income / Bonds', 'Commodities', 'Currencies / FX',
  'Private equity', 'Venture capital', 'Real estate',
  'Technology', 'Energy transition', 'ESG / Sustainability',
  'Regulation / Policy', 'M&A / Deals', 'Emerging markets',
]

export default function OnboardingFlow({ userId, product = 'digest' }: { userId: string; product?: 'digest' | 'reader' }) {
  const router = useRouter()
  const STEPS = product === 'reader' ? READER_STEPS : DIGEST_STEPS
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  // Digest-specific
  const [jobRole, setJobRole] = useState('')
  const [customJobRole, setCustomJobRole] = useState('')
  const [newsletterGoals, setNewsletterGoals] = useState<string[]>([])
  const [extraContext, setExtraContext] = useState('')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [customIndustry, setCustomIndustry] = useState('')
  const [preferredSources, setPreferredSources] = useState<string[]>([])
  const [dailyFreq, setDailyFreq] = useState('daily')
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [digestTime, setDigestTime] = useState('pre')
  // Reader-specific
  const [readerTopics, setReaderTopics] = useState<string[]>([])
  const [readerFeeds, setReaderFeeds] = useState<{ label: string; url: string }[]>([])
  const [feedUrl, setFeedUrl] = useState('')
  const [feedLabel, setFeedLabel] = useState('')
  const [feedError, setFeedError] = useState('')
  const [readerFreq, setReaderFreq] = useState('daily')
  const [showGuide, setShowGuide] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleIndustry = (label: string) =>
    setSelectedIndustries(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    )

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
    try { new URL(url) } catch { setFeedError('That doesn\'t look like a valid URL'); return }
    if (readerFeeds.some(f => f.url === url)) { setFeedError('You\'ve already added this feed'); return }
    setReaderFeeds(prev => [...prev, { label, url }])
    setFeedUrl('')
    setFeedLabel('')
    setFeedError('')
  }

  const finish = async () => {
    setSaving(true)

    if (product === 'reader') {
      await supabase
        .from('profiles')
        .update({
          name,
          products: 'reader',
          frequency: readerFreq,
          newsletter_goal: readerTopics.join(', '),
        })
        .eq('id', userId)

      // Save RSS feeds
      if (readerFeeds.length > 0) {
        await supabase.from('rss_feeds').insert(
          readerFeeds.map(f => ({ user_id: userId, label: f.label, url: f.url }))
        )
      }
    } else {
      await supabase
        .from('profiles')
        .update({
          name,
          products: 'digest',
          frequency: weeklyDigest ? (dailyFreq === 'none' ? 'weekly' : `${dailyFreq}+weekly`) : dailyFreq,
          digest_time: digestTime,
          preferred_sources: preferredSources.join(','),
          job_role: jobRole === 'other' ? customJobRole : jobRole,
          newsletter_goal: newsletterGoals.join(', ') + (extraContext ? ` — ${extraContext}` : ''),
        })
        .eq('id', userId)

      if (selectedIndustries.length > 0) {
        await supabase.from('followed_industries').insert(
          selectedIndustries.map(label => ({ user_id: userId, label }))
        )
      }
    }

    // Send welcome email (fire-and-forget)
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, product }),
    }).catch(() => {})

    setSaving(false)
    router.push('/digest')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="h-1.5 w-full rounded-full transition-colors"
                style={{ backgroundColor: i <= step ? '#1D9E75' : '#e5e7eb' }}
              />
              <span className="text-xs text-gray-400 hidden sm:block">{s}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Finbrief</h1>
              <p className="text-gray-500 mt-2">
                {product === 'reader'
                  ? 'Your subscriptions, distilled by AI. Let\'s get you set up — takes about 2 minutes.'
                  : 'Your personal finance digest. Let\'s get you set up — takes about 2 minutes.'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What should we call you?</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your first name"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Get started →
            </button>
          </div>
        )}

        {/* ═══ READER STEPS ═══ */}

        {/* Reader Step 1: Your interests */}
        {product === 'reader' && step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">What topics interest you, {name}?</h2>
              <p className="text-gray-500 mt-1 text-sm">We'll use these to filter your subscriptions and surface only the articles that matter.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {READER_TOPICS.map(topic => {
                const selected = readerTopics.includes(topic)
                return (
                  <button
                    key={topic}
                    onClick={() => setReaderTopics(prev =>
                      selected ? prev.filter(t => t !== topic) : [...prev, topic]
                    )}
                    className="px-4 py-2 rounded-full text-sm border transition-colors"
                    style={
                      selected
                        ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                        : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                    }
                  >
                    {topic}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={readerTopics.length === 0}
                className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40"
                style={{ backgroundColor: '#2563EB' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Reader Step 2: Subscriptions */}
        {product === 'reader' && step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect your subscriptions</h2>
              <p className="text-gray-500 mt-1 text-sm">Paste the RSS feed URL from any publication. Not sure where to find it? Tap a guide below.</p>
            </div>

            {/* Quick guides */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Find your RSS feed</p>
              {RSS_GUIDES.map(guide => (
                <div key={guide.name}>
                  <button
                    onClick={() => setShowGuide(showGuide === guide.name ? null : guide.name)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors hover:bg-zinc-50"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <span className="text-gray-800">{guide.name}</span>
                    <span className="text-xs text-gray-400">{showGuide === guide.name ? 'Hide' : 'Show guide'}</span>
                  </button>
                  {showGuide === guide.name && (
                    <div className="mx-4 mt-1 mb-2 px-4 py-3 rounded-lg text-xs text-gray-600 leading-relaxed" style={{ backgroundColor: '#F8F8F8' }}>
                      <p className="mb-2">{guide.instructions}</p>
                      <a href={guide.url} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: '#2563EB' }}>
                        Open {guide.name} RSS page
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add feed form */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Add a feed</p>
              <input
                value={feedLabel}
                onChange={e => setFeedLabel(e.target.value)}
                placeholder="Name (e.g. FT Markets)"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
              />
              <div className="flex gap-2">
                <input
                  value={feedUrl}
                  onChange={e => { setFeedUrl(e.target.value); setFeedError('') }}
                  placeholder="Paste RSS feed URL"
                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
                />
                <button
                  onClick={addFeed}
                  className="px-4 py-2.5 rounded-lg text-sm text-white font-medium"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  Add
                </button>
              </div>
              {feedError && <p className="text-xs text-red-500">{feedError}</p>}
            </div>

            {/* Added feeds */}
            {readerFeeds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Your feeds ({readerFeeds.length})</p>
                {readerFeeds.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[300px]">{f.url}</p>
                    </div>
                    <button
                      onClick={() => setReaderFeeds(prev => prev.filter((_, j) => j !== i))}
                      className="text-xs text-gray-400 hover:text-red-500 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">Back</button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: '#2563EB' }}
              >
                {readerFeeds.length === 0 ? 'Skip for now' : `Continue (${readerFeeds.length} feeds)`}
              </button>
            </div>
          </div>
        )}

        {/* Reader Step 3: Preferences */}
        {product === 'reader' && step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery preferences</h2>
              <p className="text-gray-500 mt-1 text-sm">How often should we send your curated read?</p>
            </div>
            <div className="flex gap-2">
              {[{ value: 'daily', label: 'Every morning' }, { value: '2x', label: 'Morning + evening' }, { value: 'weekly', label: 'Weekly digest' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReaderFreq(opt.value)}
                  className="flex-1 py-3 rounded-lg text-sm border font-medium transition-colors"
                  style={
                    readerFreq === opt.value
                      ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#2563EB' }}>Continue</button>
            </div>
          </div>
        )}

        {/* Reader Step 4: Review */}
        {product === 'reader' && step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Here's your setup, {name}</h2>
              <p className="text-gray-500 mt-1 text-sm">Review everything before we launch your Reader. Tap any section to edit.</p>
            </div>

            <button onClick={() => setStep(1)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#2563EB] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Topics</span>
                <span className="text-xs" style={{ color: '#2563EB' }}>Edit</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {readerTopics.map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#2563EB22', color: '#2563EB' }}>{t}</span>
                ))}
              </div>
            </button>

            <button onClick={() => setStep(2)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#2563EB] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Subscriptions</span>
                <span className="text-xs" style={{ color: '#2563EB' }}>Edit</span>
              </div>
              {readerFeeds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {readerFeeds.map(f => (
                    <span key={f.url} className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-100 text-gray-700">{f.label}</span>
                  ))}
                </div>
              ) : <span className="text-sm text-gray-400">No feeds added yet — you can add later in Settings</span>}
            </button>

            <button onClick={() => setStep(3)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#2563EB] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Delivery</span>
                <span className="text-xs" style={{ color: '#2563EB' }}>Edit</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {readerFreq === 'daily' ? 'Every morning' : readerFreq === '2x' ? 'Morning + evening' : 'Weekly digest'}
              </p>
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">Back</button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#2563EB' }}
              >
                {saving ? 'Setting up...' : 'Launch my Reader'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ DIGEST STEPS ═══ */}

        {/* Step 1: Your role */}
        {product === 'digest' && step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">What best describes you, {name}?</h2>
              <p className="text-gray-500 mt-1 text-sm">This helps Claude tailor your digest to the right depth and focus.</p>
            </div>

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
                <span className="text-sm font-medium">Other</span>
                <span className="text-xs mt-0.5 opacity-70">My role isn't listed above</span>
              </button>
            </div>

            {jobRole === 'other' && (
              <input
                value={customJobRole}
                onChange={e => setCustomJobRole(e.target.value)}
                placeholder="Describe your role (e.g. Hedge fund associate, Private equity analyst…)"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                autoFocus
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={!jobRole || (jobRole === 'other' && !customJobRole.trim())}
                className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40"
                style={{ backgroundColor: '#1D9E75' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Your goals */}
        {product === 'digest' && step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">What do you want from Finbrief?</h2>
              <p className="text-gray-500 mt-1 text-sm">Select all that apply — this shapes what Claude focuses on in every digest.</p>
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Anything else? <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                placeholder="e.g. I focus on UK mid-cap stocks, I'm preparing for retirement, I manage a $2M portfolio…"
                rows={2}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={newsletterGoals.length === 0}
                className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-40"
                style={{ backgroundColor: '#1D9E75' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Watchlist */}
        {product === 'digest' && step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Build your watchlist</h2>
              <p className="text-gray-500 mt-1 text-sm">Tap popular assets below or search for anything else.</p>
            </div>

            {/* Quick-pick popular stocks — grouped by category */}
            {POPULAR_PICKS.map(group => (
              <div key={group.category}>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{group.category}</label>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(stock => {
                    const added = watchlist.some(w => w.ticker === stock.ticker)
                    return (
                      <button
                        key={stock.ticker}
                        onClick={() => {
                          if (added) {
                            setWatchlist(prev => prev.filter(w => w.ticker !== stock.ticker))
                          } else {
                            setWatchlist(prev => [...prev, { id: `quick-${stock.ticker}`, ...stock }])
                          }
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                        style={
                          added
                            ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                            : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                        }
                      >
                        {added && '✓ '}{stock.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Search for more */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Or search for more</label>
              <AssetSearch
                userId={userId}
                existing={watchlist}
                onAdd={item => setWatchlist(prev => [...prev, item])}
                onRemove={id => setWatchlist(prev => prev.filter(i => i.id !== id))}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#1D9E75' }}>
                {watchlist.length === 0 ? 'Skip for now →' : `Continue (${watchlist.length} assets) →`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Industries */}
        {product === 'digest' && step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Follow industries</h2>
              <p className="text-gray-500 mt-1 text-sm">We'll pull relevant news for these sectors in every digest.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => toggleIndustry(ind)}
                  className="px-4 py-2 rounded-full text-sm border transition-colors"
                  style={
                    selectedIndustries.includes(ind)
                      ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                      : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
                  }
                >
                  {ind}
                </button>
              ))}
            </div>

            {selectedIndustries.filter(i => !INDUSTRIES.includes(i)).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Your custom topics</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIndustries.filter(i => !INDUSTRIES.includes(i)).map(ind => (
                    <div
                      key={ind}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
                      style={{ backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }}
                    >
                      <span>{ind}</span>
                      <button onClick={() => setSelectedIndustries(prev => prev.filter(i => i !== ind))} className="opacity-70 hover:opacity-100 leading-none">✕</button>
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
              <button onClick={addCustomIndustry} className="px-4 py-2 rounded-lg text-sm text-white font-medium" style={{ backgroundColor: '#378ADD' }}>Add</button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#1D9E75' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 5: News sources */}
        {product === 'digest' && step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Where do you get your news?</h2>
              <p className="text-gray-500 mt-1 text-sm">We'll pull industry news only from the sources you trust. Leave blank for our unbiased default (Reuters, AP, BBC).</p>
            </div>
            <SourcePicker selected={preferredSources} onChange={setPreferredSources} />
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button onClick={() => setStep(6)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#1D9E75' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 6: Preferences */}
        {product === 'digest' && step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delivery preferences</h2>
              <p className="text-gray-500 mt-1 text-sm">When do you want your digest?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daily digest</label>
              <div className="flex gap-2">
                {[{ value: 'daily', label: 'Once a day' }, { value: '2x', label: 'Twice a day' }, { value: 'none', label: 'No daily' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDailyFreq(opt.value)}
                    className="flex-1 py-2.5 rounded-lg text-sm border font-medium transition-colors"
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
            {dailyFreq !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily timing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ value: 'pre', label: '☀️ Pre-market' }, { value: 'eod', label: '📊 End of day' }, { value: 'both', label: '⚡ Both' }].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDigestTime(opt.value)}
                      className="py-2.5 rounded-lg text-sm border font-medium transition-colors"
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
            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button onClick={() => setStep(7)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: '#1D9E75' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {product === 'digest' && step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Here's your setup, {name}</h2>
              <p className="text-gray-500 mt-1 text-sm">Review everything before we launch your digest. Tap any section to go back and edit.</p>
            </div>

            {/* Role */}
            <button onClick={() => setStep(1)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#1D9E75] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Your role</span>
                <span className="text-xs text-[#1D9E75]">Edit</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {jobRole === 'other' ? customJobRole : JOB_ROLES.find(r => r.value === jobRole)?.label ?? 'Not set'}
              </p>
            </button>

            {/* Goals */}
            <button onClick={() => setStep(2)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#1D9E75] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Your goals</span>
                <span className="text-xs text-[#1D9E75]">Edit</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {newsletterGoals.length > 0
                  ? newsletterGoals.map(g => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#378ADD22', color: '#378ADD' }}>
                        {NEWSLETTER_GOALS.find(ng => ng.value === g)?.label.replace(/^[^\s]+ /, '') ?? g}
                      </span>
                    ))
                  : <span className="text-sm text-gray-400">None selected</span>
                }
              </div>
              {extraContext && <p className="text-xs text-gray-500 mt-2 italic">"{extraContext}"</p>}
            </button>

            {/* Watchlist */}
            <button onClick={() => setStep(3)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#1D9E75] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Watchlist</span>
                <span className="text-xs text-[#1D9E75]">Edit</span>
              </div>
              {watchlist.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {watchlist.map(w => (
                    <span key={w.ticker} className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-100 text-gray-700">{w.name}</span>
                  ))}
                </div>
              ) : <span className="text-sm text-gray-400">No assets yet — you can add later</span>}
            </button>

            {/* Industries */}
            <button onClick={() => setStep(4)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#1D9E75] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Industries</span>
                <span className="text-xs text-[#1D9E75]">Edit</span>
              </div>
              {selectedIndustries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedIndustries.map(ind => (
                    <span key={ind} className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-100 text-gray-700">{ind}</span>
                  ))}
                </div>
              ) : <span className="text-sm text-gray-400">None selected</span>}
            </button>

            {/* Delivery */}
            <button onClick={() => setStep(6)} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-[#1D9E75] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Delivery</span>
                <span className="text-xs text-[#1D9E75]">Edit</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {dailyFreq === 'none' ? 'No daily digest' : dailyFreq === '2x' ? 'Twice daily' : 'Once daily'}
                {weeklyDigest ? ' + Weekly summary' : ''}
              </p>
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(6)} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-gray-600">← Back</button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#1D9E75' }}
              >
                {saving ? 'Setting up...' : 'Launch my Digest'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
