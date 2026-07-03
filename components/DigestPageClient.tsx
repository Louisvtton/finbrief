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

const DIGEST_TYPES = ['pre', 'eod', 'weekly'] as const
type DigestType = typeof DIGEST_TYPES[number]
const TYPE_LABELS: Record<string, string> = { pre: 'Pre-market', eod: 'End of day', weekly: 'Weekly' }
const TYPE_COLORS: Record<string, string> = { pre: '#1D9E75', eod: '#2563EB', weekly: '#7C3AED' }

type ReaderTab = 'daily' | 'weekly'

// ── Shared history list ──────────────────────────────────────────
function HistoryPanel({
  items, selectedId, onSelect, color,
  labelFn,
}: {
  items: DigestRow[]
  selectedId: string
  onSelect: (id: string) => void
  color: string
  labelFn?: (d: DigestRow) => string
}) {
  if (items.length === 0) return null
  return (
    <div className="rounded-2xl border overflow-hidden mb-5" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
      <p className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-b" style={{ borderColor: '#1A1A1A', color: '#444' }}>Past briefs</p>
      <div className="divide-y max-h-52 overflow-y-auto" style={{ borderColor: '#1A1A1A' }}>
        {items.map(d => {
          const isActive = d.id === selectedId
          const label = labelFn ? labelFn(d) : (d.content as any)?.headline || formatDate(d.created_at)
          return (
            <button key={d.id}
              onClick={() => onSelect(d.id)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors"
              style={isActive ? { backgroundColor: color + '10' } : {}}>
              <div>
                <p className="text-sm font-medium text-white line-clamp-1">{label}</p>
                <p className="text-xs text-zinc-500">{formatDate(d.created_at)} · {formatTime(d.created_at)}</p>
              </div>
              {isActive && <span className="text-xs font-semibold shrink-0 ml-3" style={{ color }}> Viewing</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Generate card ────────────────────────────────────────────────
function GenerateCard({
  color, placeholder, buttonLabel, loading, loadingLabel, error,
  notes, onNotesChange, onGenerate,
  extraRow,
}: {
  color: string
  placeholder: string
  buttonLabel: string
  loading: boolean
  loadingLabel: string
  error: string
  notes: string
  onNotesChange: (v: string) => void
  onGenerate: () => void
  extraRow?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border p-5 mb-5" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
      <textarea
        value={notes}
        onChange={e => onNotesChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-transparent text-white placeholder-zinc-600 focus:border-zinc-600 transition-colors resize-none mb-3"
        style={{ borderColor: '#222' }}
      />
      {extraRow}
      <button onClick={onGenerate} disabled={loading}
        className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ backgroundColor: color }}>
        {loading ? loadingLabel : buttonLabel}
      </button>
      {loading && <p className="text-xs text-zinc-500 mt-2 text-center">Claude is working — takes 15–30 seconds</p>}
      {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
    </div>
  )
}

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

  // Main tabs
  const [tab, setTab] = useState<'digest' | 'reader'>(initialTab)

  // Digest sub-tabs
  const [digestType, setDigestType] = useState<DigestType>('pre')
  const [digestRows, setDigestRows] = useState<DigestRow[]>(digests)
  const [selectedIds, setSelectedIds] = useState<Record<DigestType, string>>({
    pre: digests.find(d => d.digest_type === 'pre')?.id ?? '',
    eod: digests.find(d => d.digest_type === 'eod')?.id ?? '',
    weekly: digests.find(d => d.digest_type === 'weekly')?.id ?? '',
  })
  const [digestNotes, setDigestNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState('')

  // Reader sub-tabs
  const [readerTab, setReaderTab] = useState<ReaderTab>('daily')
  const [readerRows, setReaderRows] = useState<DigestRow[]>(readerDigests)
  const [selectedReaderIds, setSelectedReaderIds] = useState<Record<ReaderTab, string>>({
    daily: readerDigests.find(d => ['reader', 'reader_custom'].includes(d.digest_type))?.id ?? '',
    weekly: readerDigests.find(d => d.digest_type === 'reader_weekly')?.id ?? '',
  })
  const [customTopic, setCustomTopic] = useState('')
  const [generatingReader, setGeneratingReader] = useState(false)
  const [readerGenError, setReaderGenError] = useState('')

  // Derived
  const currentDigestType = digestType
  const typeRows = digestRows.filter(d => d.digest_type === currentDigestType)
  const selectedDigest = typeRows.find(d => d.id === selectedIds[currentDigestType]) ?? typeRows[0]

  const dailyReaderRows = readerRows.filter(d => ['reader', 'reader_custom'].includes(d.digest_type))
  const weeklyReaderRows = readerRows.filter(d => d.digest_type === 'reader_weekly')
  const currentReaderRows = readerTab === 'daily' ? dailyReaderRows : weeklyReaderRows
  const selectedReader = currentReaderRows.find(d => d.id === selectedReaderIds[readerTab]) ?? currentReaderRows[0]
  const readerContent = selectedReader?.content as unknown as ReaderContent | undefined

  const generate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestType: currentDigestType, extraNotes: digestNotes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      const newRow: DigestRow = { id: data.digestId, digest_type: currentDigestType, created_at: new Date().toISOString(), content: data.content }
      setDigestRows(prev => [newRow, ...prev])
      setSelectedIds(prev => ({ ...prev, [currentDigestType]: data.digestId }))
      setDigestNotes('')
    } catch (err: any) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateReader = async () => {
    setGeneratingReader(true)
    setReaderGenError('')
    try {
      const res = await fetch('/api/reader/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          briefType: readerTab,
          customTopic: readerTab === 'daily' && customTopic.trim() ? customTopic.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      const dtype = readerTab === 'weekly' ? 'reader_weekly' : (customTopic.trim() ? 'reader_custom' : 'reader')
      const newRow: DigestRow = { id: data.digestId, digest_type: dtype, created_at: new Date().toISOString(), content: data.content }
      setReaderRows(prev => [newRow, ...prev])
      setSelectedReaderIds(prev => ({ ...prev, [readerTab]: data.digestId }))
      setCustomTopic('')
    } catch (err: any) {
      setReaderGenError(err.message)
    } finally {
      setGeneratingReader(false)
    }
  }

  const sendEmail = async () => {
    if (!selectedDigest) return
    setSending(true)
    setSendStatus('idle')
    try {
      const res = await fetch('/api/digest/send-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestId: selectedDigest.id }),
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

      {/* Top nav */}
      <nav className="sticky top-0 z-20 border-b px-5 h-14" style={{ backgroundColor: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)', borderColor: '#1A1A1A' }}>
        <div className="max-w-3xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
            <span className="font-extrabold text-lg text-white">brief</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:border-zinc-600 hover:text-white"
              style={{ borderColor: '#222', color: '#666' }}>
              Settings
            </Link>
            <Link href="/settings" className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: '#1D9E75' }}>
              {userName ? userName[0].toUpperCase() : 'U'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Digest / Reader main tab bar */}
      <div className="sticky top-14 z-10 border-b" style={{ backgroundColor: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)', borderColor: '#1A1A1A' }}>
        <div className="max-w-3xl mx-auto px-5 flex">
          {(['digest', 'reader'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="relative px-6 py-4 text-sm font-semibold transition-colors capitalize"
              style={tab === t ? { color: t === 'digest' ? '#1D9E75' : '#2563EB' } : { color: '#555' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: t === 'digest' ? '#1D9E75' : '#2563EB' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6">

        {/* ── DIGEST TAB ── */}
        {tab === 'digest' && !hasDigest && (
          <div className="py-20 text-center">
            <p className="text-zinc-400 mb-6">You don't have Digest set up yet.</p>
            <Link href="/onboarding?product=digest&add=true"
              className="inline-flex px-8 py-3.5 rounded-xl text-white font-bold text-sm"
              style={{ backgroundColor: '#1D9E75' }}>
              Set up Digest →
            </Link>
          </div>
        )}

        {tab === 'digest' && hasDigest && (
          <>
            {/* Digest type sub-tabs */}
            <div className="flex gap-2 mb-6">
              {DIGEST_TYPES.map(t => {
                const col = TYPE_COLORS[t]
                const count = digestRows.filter(d => d.digest_type === t).length
                return (
                  <button key={t} onClick={() => setDigestType(t)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                    style={digestType === t
                      ? { backgroundColor: col + '18', borderColor: col, color: col }
                      : { backgroundColor: '#111', borderColor: '#1A1A1A', color: '#555' }}>
                    {TYPE_LABELS[t]}
                    {count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={digestType === t
                          ? { backgroundColor: col + '30', color: col }
                          : { backgroundColor: '#222', color: '#555' }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* History */}
            <HistoryPanel
              items={typeRows}
              selectedId={selectedIds[currentDigestType]}
              onSelect={id => setSelectedIds(prev => ({ ...prev, [currentDigestType]: id }))}
              color={TYPE_COLORS[currentDigestType]}
              labelFn={d => `${TYPE_LABELS[d.digest_type]} — ${formatDate(d.created_at)}`}
            />

            {/* Generate card */}
            <GenerateCard
              color={TYPE_COLORS[currentDigestType]}
              placeholder={`Any extra focus for this ${TYPE_LABELS[currentDigestType].toLowerCase()} brief? (optional) — e.g. "focus on my AstraZeneca position" or "include Fed commentary"`}
              buttonLabel={`Generate ${TYPE_LABELS[currentDigestType]} brief`}
              loading={generating}
              loadingLabel="Generating…"
              error={genError}
              notes={digestNotes}
              onNotesChange={setDigestNotes}
              onGenerate={generate}
              extraRow={selectedDigest && (
                <button onClick={sendEmail} disabled={sending}
                  className="w-full py-2 rounded-xl text-sm font-medium border mb-3 transition-colors disabled:opacity-40"
                  style={sendStatus === 'sent'
                    ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                    : { borderColor: '#222', color: '#666' }}>
                  {sending ? 'Sending…' : sendStatus === 'sent' ? 'Sent to your inbox' : 'Email me the current brief'}
                </button>
              )}
            />
            {sendStatus === 'error' && <p className="text-xs text-red-400 mb-3 text-center">{sendError}</p>}

            {/* Brief content */}
            {selectedDigest ? (
              <DigestView digest={selectedDigest.content} digestId={selectedDigest.id} userId={userId} />
            ) : (
              <div className="py-16 text-center rounded-2xl border" style={{ borderColor: '#1A1A1A' }}>
                <p className="text-zinc-500 text-sm">No {TYPE_LABELS[currentDigestType].toLowerCase()} briefs yet.</p>
                <p className="text-zinc-600 text-xs mt-1">Hit the button above to generate your first one.</p>
              </div>
            )}
          </>
        )}

        {/* ── READER TAB ── */}
        {tab === 'reader' && !hasReader && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6"
              style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Stop reading everything.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
              Connect your FT, Economist, or Bloomberg RSS feeds. Finbrief reads every article and sends you only what's relevant to your interests.
            </p>
            <Link href="/onboarding?product=reader&add=true"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#2563EB' }}>
              Set up Reader →
            </Link>
          </div>
        )}

        {tab === 'reader' && hasReader && (
          <>
            {/* Daily / Weekly sub-tabs */}
            <div className="flex gap-2 mb-6">
              {(['daily', 'weekly'] as ReaderTab[]).map(rt => {
                const count = rt === 'daily' ? dailyReaderRows.length : weeklyReaderRows.length
                return (
                  <button key={rt} onClick={() => setReaderTab(rt)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all capitalize"
                    style={readerTab === rt
                      ? { backgroundColor: 'rgba(37,99,235,0.12)', borderColor: '#2563EB', color: '#60a5fa' }
                      : { backgroundColor: '#111', borderColor: '#1A1A1A', color: '#555' }}>
                    {rt.charAt(0).toUpperCase() + rt.slice(1)}
                    {count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={readerTab === rt
                          ? { backgroundColor: 'rgba(37,99,235,0.2)', color: '#60a5fa' }
                          : { backgroundColor: '#222', color: '#555' }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Reader history */}
            <HistoryPanel
              items={currentReaderRows}
              selectedId={selectedReaderIds[readerTab]}
              onSelect={id => setSelectedReaderIds(prev => ({ ...prev, [readerTab]: id }))}
              color="#2563EB"
              labelFn={d => (d.content as any)?.headline || formatDate(d.created_at)}
            />

            {/* Reader generate card */}
            <GenerateCard
              color="#2563EB"
              placeholder={readerTab === 'daily'
                ? 'Focus on a specific topic? e.g. "oil markets", "Fed policy" (optional)'
                : 'Any specific focus for this week\'s roundup? (optional)'}
              buttonLabel={readerTab === 'daily' ? "Generate today's Reader brief" : "Generate weekly Reader roundup"}
              loading={generatingReader}
              loadingLabel="Reading your feeds…"
              error={readerGenError}
              notes={customTopic}
              onNotesChange={setCustomTopic}
              onGenerate={generateReader}
            />

            {/* Reader brief content */}
            {readerContent ? (
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
                <div className="px-6 py-5 border-b" style={{ borderColor: '#1A1A1A' }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#2563EB' }}>
                        {selectedReader?.digest_type === 'reader_weekly' ? 'Weekly roundup' : selectedReader?.digest_type === 'reader_custom' ? 'Custom brief' : 'Daily brief'}
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
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-zinc-500">{article.source}</span>
                        {article.tag && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ backgroundColor: '#1A1A1A', color: '#888' }}>
                            {article.tag}
                          </span>
                        )}
                      </div>
                      <a href={article.url} target="_blank" rel="noopener noreferrer"
                        className="text-base font-bold text-white leading-snug hover:underline block mb-2">
                        {article.title}
                      </a>
                      <p className="text-sm text-zinc-400 leading-relaxed">{article.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : !generatingReader && (
              <div className="rounded-2xl border px-6 py-12 text-center" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <p className="text-zinc-500 text-sm mb-1">No {readerTab} briefs yet.</p>
                <p className="text-zinc-600 text-xs">Hit the button above to generate your first one.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
