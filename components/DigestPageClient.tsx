'use client'

import { useState } from 'react'
import Link from 'next/link'
import DigestView from './DigestView'
import type { DigestContent } from '@/types'

interface DigestRow {
  id: string
  digest_type: string
  created_at: string
  content: DigestContent
}

interface ReaderContent {
  headline: string
  opening: string
  customTopic?: string | null
  articles: { source: string; title: string; url: string; summary: string; tag: string }[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_LABELS: Record<string, string> = { pre: 'Pre-market', eod: 'End of day', weekly: 'Weekly' }
const TYPE_COLORS: Record<string, string> = { pre: '#1D9E75', eod: '#2563EB', weekly: '#7C3AED' }

export default function DigestPageClient({
  userId, digests, readerDigests = [], products = 'digest', userName = ''
}: {
  userId: string
  digests: DigestRow[]
  readerDigests?: DigestRow[]
  products?: string
  userName?: string
}) {
  const hasReader = products === 'reader' || products === 'both'
  const hasDigest = products === 'digest' || products === 'both'
  const initialTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'reader' ? 'reader' : hasDigest ? 'digest' : 'reader'
  const [tab, setTab] = useState<'digest' | 'reader'>(initialTab)

  // Digest state
  const [selectedId, setSelectedId] = useState<string>(digests[0]?.id ?? '')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [generating, setGenerating] = useState<'pre' | 'eod' | 'weekly' | null>(null)
  const [genError, setGenError] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState('')

  // Reader state
  const [readerDigestList, setReaderDigestList] = useState<DigestRow[]>(readerDigests)
  const [selectedReaderId, setSelectedReaderId] = useState<string>(readerDigests[0]?.id ?? '')
  const [readerHistoryOpen, setReaderHistoryOpen] = useState(false)
  const [generatingReader, setGeneratingReader] = useState(false)
  const [readerGenError, setReaderGenError] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  const selected = digests.find(d => d.id === selectedId) ?? digests[0]
  const selectedReader = readerDigestList.find(d => d.id === selectedReaderId) ?? readerDigestList[0]
  const readerContent = selectedReader?.content as unknown as ReaderContent | undefined

  const generate = async (digestType: 'pre' | 'eod' | 'weekly') => {
    setGenerating(digestType)
    setGenError('')
    try {
      const res = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      window.location.href = '/digest'
    } catch (err: any) {
      setGenError(err.message)
      setGenerating(null)
    }
  }

  const generateReader = async (topic?: string) => {
    setGeneratingReader(true)
    setReaderGenError('')
    try {
      const res = await fetch('/api/reader/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, customTopic: topic || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      // Add the new digest to the top of the list
      const newDigest: DigestRow = {
        id: data.digestId,
        digest_type: topic ? 'reader_custom' : 'reader',
        created_at: new Date().toISOString(),
        content: data.content,
      }
      setReaderDigestList(prev => [newDigest, ...prev])
      setSelectedReaderId(data.digestId)
      setCustomTopic('')
    } catch (err: any) {
      setReaderGenError(err.message)
    } finally {
      setGeneratingReader(false)
    }
  }

  const sendEmail = async () => {
    if (!selected) return
    setSending(true)
    setSendStatus('idle')
    setSendError('')
    try {
      const res = await fetch('/api/digest/send-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestId: selected.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      setSendStatus('sent')
      setTimeout(() => setSendStatus('idle'), 4000)
    } catch (err: any) {
      setSendError(err.message)
      setSendStatus('error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A', color: '#fff', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b px-5 h-16" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1A1A1A' }}>
        <div className="max-w-3xl mx-auto h-full flex items-center justify-between gap-3">

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-0.5 shrink-0">
              <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
              <span className="font-extrabold text-lg text-white">brief</span>
            </Link>
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: '#1A1A1A' }}>
              <button onClick={() => setTab('digest')} className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={tab === 'digest' ? { backgroundColor: '#1D9E75', color: '#fff' } : { color: '#666' }}>
                Digest
              </button>
              <button onClick={() => setTab('reader')} className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={tab === 'reader' ? { backgroundColor: '#2563EB', color: '#fff' } : { color: '#666' }}>
                Reader
              </button>
            </div>

            {tab === 'digest' && digests.length > 0 && (
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                style={historyOpen
                  ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                  : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}
              >
                History ({digests.length})
              </button>
            )}

            {tab === 'reader' && hasReader && readerDigestList.length > 0 && (
              <button
                onClick={() => setReaderHistoryOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                style={readerHistoryOpen
                  ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                  : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}
              >
                History ({readerDigestList.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {tab === 'digest' && selected && (
              <button
                onClick={sendEmail}
                disabled={sending || !!generating}
                className="hidden md:block text-xs px-3 py-1.5 rounded-lg font-medium border transition-all disabled:opacity-40"
                style={sendStatus === 'sent'
                  ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                  : { backgroundColor: '#111', borderColor: '#222', color: '#888' }}
              >
                {sending ? 'Sending...' : sendStatus === 'sent' ? 'Sent' : 'Email me'}
              </button>
            )}
            {tab === 'digest' && (['pre', 'eod', 'weekly'] as const).map(type => (
              <button
                key={type}
                onClick={() => generate(type)}
                disabled={!!generating}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all disabled:opacity-40"
                style={generating === type
                  ? { backgroundColor: TYPE_COLORS[type], borderColor: TYPE_COLORS[type], color: '#fff' }
                  : { backgroundColor: '#111', borderColor: TYPE_COLORS[type] + '66', color: TYPE_COLORS[type] }}
              >
                {generating === type ? 'Generating...' : TYPE_LABELS[type]}
              </button>
            ))}
            <Link href="/settings"
              className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors hover:border-zinc-500"
              style={{ borderColor: '#222', color: '#888', backgroundColor: '#111' }}>
              Settings
            </Link>
            <Link href="/settings"
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1D9E75' }}>
              {userName ? userName[0].toUpperCase() : 'U'}
            </Link>
          </div>
        </div>

        {(generating || genError || sendStatus === 'error') && (
          <div className="max-w-3xl mx-auto pb-2">
            {generating && <p className="text-xs text-center text-zinc-500">Claude is reading the markets — takes 15–30 seconds</p>}
            {genError && <p className="text-xs text-red-400 text-center">{genError}</p>}
            {sendStatus === 'error' && <p className="text-xs text-red-400 text-center">Email failed: {sendError}</p>}
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-5">

        {/* ── READER TAB ── */}
        {tab === 'reader' && !hasReader && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Stop reading everything.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
              Connect your FT, Economist, or Bloomberg RSS feeds. Finbrief reads every article and sends you only what's relevant to your interests — with summaries.
            </p>
            <Link
              href="/onboarding?product=reader&add=true"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#2563EB' }}
            >
              Set up Reader →
            </Link>
          </div>
        )}

        {tab === 'reader' && hasReader && (
          <div className="py-8">

            {/* Reader history panel */}
            {readerHistoryOpen && readerDigestList.length > 0 && (
              <div className="mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1A1A1A' }}>
                  <h3 className="text-sm font-bold text-white">Reader history</h3>
                  <button onClick={() => setReaderHistoryOpen(false)} className="text-xs text-zinc-500 hover:text-white transition-colors">Close</button>
                </div>
                <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: '#1A1A1A' }}>
                  {readerDigestList.map(d => {
                    const isActive = d.id === selectedReaderId
                    const rc = d.content as unknown as ReaderContent
                    return (
                      <button
                        key={d.id}
                        onClick={() => { setSelectedReaderId(d.id); setReaderHistoryOpen(false) }}
                        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/5"
                        style={isActive ? { backgroundColor: 'rgba(37,99,235,0.08)' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0"
                            style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#2563EB' }}>
                            {d.digest_type === 'reader_custom' ? 'Custom' : 'Reader'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">{rc?.headline || formatDate(d.created_at)}</p>
                            <p className="text-xs text-zinc-500">{formatDate(d.created_at)} · {formatTime(d.created_at)}</p>
                          </div>
                        </div>
                        {isActive && <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Viewing</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Generate controls */}
            <div className="rounded-2xl border p-5 mb-6" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => generateReader()}
                  disabled={generatingReader}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  {generatingReader ? 'Reading your feeds...' : 'Generate today\'s Reader brief'}
                </button>
              </div>

              {/* Custom topic */}
              <div className="mt-3 flex gap-2">
                <input
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && customTopic.trim() && generateReader(customTopic.trim())}
                  placeholder='Brief me on a topic, e.g. "oil markets"'
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border outline-none bg-transparent text-white placeholder-zinc-600 focus:border-zinc-500 transition-colors"
                  style={{ borderColor: '#222' }}
                />
                <button
                  onClick={() => customTopic.trim() && generateReader(customTopic.trim())}
                  disabled={generatingReader || !customTopic.trim()}
                  className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ backgroundColor: '#333' }}
                >
                  Go
                </button>
              </div>

              {generatingReader && (
                <p className="text-xs text-zinc-500 mt-3 text-center">Claude is scanning your feeds — takes 15–30 seconds</p>
              )}
              {readerGenError && (
                <p className="text-xs text-red-400 mt-3 text-center">{readerGenError}</p>
              )}
            </div>

            {/* Current Reader brief */}
            {readerContent ? (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
                <div className="px-6 py-5 border-b" style={{ borderColor: '#1A1A1A' }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#2563EB' }}>
                        {selectedReader?.digest_type === 'reader_custom' ? 'Custom brief' : 'Reader brief'}
                      </span>
                      {readerContent.customTopic && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
                          {readerContent.customTopic}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">
                      {selectedReader ? formatDate(selectedReader.created_at) : ''}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">{readerContent.headline}</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">{readerContent.opening}</p>
                </div>

                <div className="divide-y" style={{ borderColor: '#1A1A1A' }}>
                  {(readerContent.articles ?? []).map((article, i) => (
                    <div key={i} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-zinc-500">{article.source}</span>
                          {article.tag && (
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                              style={{ backgroundColor: '#1A1A1A', color: '#888' }}>
                              {article.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-bold text-white leading-snug hover:underline block mb-2"
                      >
                        {article.title}
                      </a>
                      <p className="text-sm text-zinc-400 leading-relaxed">{article.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !generatingReader && (
                <div className="rounded-2xl border px-6 py-12 text-center" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                  <p className="text-zinc-500 text-sm mb-1">No briefs yet.</p>
                  <p className="text-zinc-600 text-xs">Hit "Generate today's Reader brief" above to get started.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* ── DIGEST TAB ── */}
        {tab === 'digest' && historyOpen && (
          <div className="my-4 rounded-2xl border overflow-hidden" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1A1A1A' }}>
              <h3 className="text-sm font-bold text-white">Digest history</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-xs text-zinc-500 hover:text-white transition-colors">Close</button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: '#1A1A1A' }}>
              {digests.map(d => {
                const isActive = d.id === selectedId
                const col = TYPE_COLORS[d.digest_type] ?? '#888'
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedId(d.id); setHistoryOpen(false) }}
                    className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/5"
                    style={isActive ? { backgroundColor: 'rgba(29,158,117,0.08)' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0" style={{ backgroundColor: col + '22', color: col }}>
                        {TYPE_LABELS[d.digest_type] ?? d.digest_type}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{formatDate(d.created_at)}</p>
                        <p className="text-xs text-zinc-500">{formatTime(d.created_at)}</p>
                      </div>
                    </div>
                    {isActive && <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>Viewing</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'digest' && !selected && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#1D9E75' }} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">No digest yet</h2>
            <p className="text-zinc-400 mb-8 text-sm">Generate your first digest to see personalised market insights.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {(['pre', 'eod', 'weekly'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => generate(type)}
                  disabled={!!generating}
                  className="px-6 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-85"
                  style={{ backgroundColor: TYPE_COLORS[type] }}
                >
                  {generating === type ? 'Generating...' : `${TYPE_LABELS[type]} brief`}
                </button>
              ))}
            </div>
            {generating && <p className="text-xs text-zinc-500 mt-4">Takes 15–30 seconds</p>}
            {genError && <p className="text-sm text-red-400 mt-3">{genError}</p>}
          </div>
        )}

        {tab === 'digest' && selected && (
          <DigestView digest={selected.content} digestId={selected.id} userId={userId} />
        )}
      </div>
    </div>
  )
}
