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

export default function DigestPageClient({ userId, digests }: { userId: string; digests: DigestRow[] }) {
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

          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-0.5 shrink-0">
              <span className="font-extrabold text-lg" style={{ color: '#1D9E75' }}>fin</span>
              <span className="font-extrabold text-lg text-white">brief</span>
            </Link>
            <span className="hidden md:block text-xs font-semibold tracking-widest uppercase text-zinc-500">Digest</span>
            {digests.length > 0 && (
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

        {/* History panel */}
        {historyOpen && (
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
        {!selected && (
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
        {selected && (
          <DigestView digest={selected.content} digestId={selected.id} userId={userId} />
        )}
      </div>
    </div>
  )
}
