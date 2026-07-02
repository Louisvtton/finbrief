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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_LABELS: Record<string, string> = { pre: 'Pre-market', eod: 'End of day', weekly: 'Weekly' }
const TYPE_COLORS: Record<string, string> = { pre: '#1D9E75', eod: '#2563EB', weekly: '#7C3AED' }

export default function DigestPageClient({ userId, digests, products = 'digest', userName = '' }: { userId: string; digests: DigestRow[]; products?: string; userName?: string }) {
  const hasReader = products === 'reader' || products === 'both'
  const hasDigest = products === 'digest' || products === 'both'
  const initialTab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'reader' ? 'reader' : hasDigest ? 'digest' : 'reader'
  const [tab, setTab] = useState<'digest' | 'reader'>(initialTab)
  const [selectedId, setSelectedId] = useState<string>(digests[0]?.id ?? '')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [generating, setGenerating] = useState<'pre' | 'eod' | 'weekly' | null>(null)
  const [genError, setGenError] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState('')

  const selected = digests.find(d => d.id === selectedId) ?? digests[0]

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

          {/* Logo + tabs */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-0.5 shrink-0">
              <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
              <span className="font-extrabold text-lg text-white">brief</span>
            </Link>
            {/* Always show both tabs */}
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
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selected && (
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
            {(['pre', 'eod', 'weekly'] as const).map(type => (
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1D9E75' }}>
              U
            </Link>
          </div>
        </div>

        {/* Status bar */}
        {(generating || genError || sendStatus === 'error') && (
          <div className="max-w-3xl mx-auto pb-2">
            {generating && (
              <p className="text-xs text-center text-zinc-500">Claude is reading the markets — takes 15–30 seconds</p>
            )}
            {genError && <p className="text-xs text-red-400 text-center">{genError}</p>}
            {sendStatus === 'error' && <p className="text-xs text-red-400 text-center">Email failed: {sendError}</p>}
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-5">

        {/* Reader panel */}
        {tab === 'reader' && !hasReader && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Stop reading everything.</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-2">
              Connect your FT, Economist, or Bloomberg RSS feeds. Finbrief reads every article and sends you only what's relevant to your interests — with summaries.
            </p>
            <div className="flex flex-col items-center gap-2 text-xs text-zinc-500 mb-8">
              {['Works with any publication that has an RSS feed', 'Filter by topics you care about', 'Delivered every morning alongside your Digest'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span style={{ color: '#2563EB' }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link
              href="/onboarding?product=reader&add=true"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#2563EB' }}
            >
              Set up Reader →
            </Link>
            <p className="text-xs text-zinc-600 mt-4">Takes 2 minutes. Uses your existing account.</p>
          </div>
        )}

        {tab === 'reader' && hasReader && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
            </div>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#111', border: '1px solid #1A1A1A' }}>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#2563EB' }} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Your Reader is active</h2>
            <p className="text-zinc-400 mb-8 text-sm max-w-sm mx-auto leading-relaxed">
              Finbrief scans your connected feeds overnight and sends your curated read each morning — only articles relevant to your topics.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85"
                style={{ backgroundColor: '#2563EB' }}
              >
                Manage subscriptions
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:border-zinc-500"
                style={{ borderColor: '#222', color: '#888' }}
              >
                Edit topics
              </Link>
            </div>
          </div>
        )}

        {/* History panel (digest tab only) */}
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

        {/* Empty state */}
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

        {/* Digest content */}
        {tab === 'digest' && selected && (
          <DigestView digest={selected.content} digestId={selected.id} userId={userId} />
        )}
      </div>
    </div>
  )
}
