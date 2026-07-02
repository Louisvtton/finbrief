'use client'

import { useState } from 'react'
import DigestView from './DigestView'
import type { DigestContent } from '@/types'

interface DigestRow {
  id: string
  digest_type: string
  created_at: string
  content: DigestContent
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DigestPageClient({
  userId,
  digests,
}: {
  userId: string
  digests: DigestRow[]
}) {
  const [selectedId, setSelectedId] = useState<string>(digests[0]?.id ?? '')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [generating, setGenerating] = useState<'pre' | 'eod' | 'weekly' | null>(null)
  const [genError, setGenError] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState('')

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

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Nav */}
      <nav className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Left: logo + history */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg" style={{ color: '#1D9E75' }}>finbrief</span>
            {digests.length > 0 && (
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors"
                style={
                  historyOpen
                    ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                🕐 History
                <span className="opacity-60">({digests.length})</span>
              </button>
            )}
          </div>

          {/* Right: settings + send + generate buttons */}
          <div className="flex items-center gap-2">
            <a href="/settings" className="text-sm text-gray-500 hover:text-gray-800 mr-1">Settings</a>
            {selected && (
              <button
                onClick={sendEmail}
                disabled={sending || !!generating}
                className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 border transition-all"
                style={
                  sendStatus === 'sent'
                    ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#6b7280' }
                }
              >
                {sending ? '📤 Sending…' : sendStatus === 'sent' ? '✓ Sent!' : '📧 Email me'}
              </button>
            )}
            <button
              onClick={() => generate('pre')}
              disabled={!!generating}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 border transition-colors"
              style={
                generating === 'pre'
                  ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75', color: '#fff' }
                  : { backgroundColor: '#fff', borderColor: '#1D9E75', color: '#1D9E75' }
              }
            >
              {generating === 'pre' ? '⏳…' : '☀️ Pre-market'}
            </button>
            <button
              onClick={() => generate('eod')}
              disabled={!!generating}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 border transition-colors"
              style={
                generating === 'eod'
                  ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                  : { backgroundColor: '#fff', borderColor: '#378ADD', color: '#378ADD' }
              }
            >
              {generating === 'eod' ? '⏳…' : '📊 End of day'}
            </button>
            <button
              onClick={() => generate('weekly')}
              disabled={!!generating}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 border transition-colors"
              style={
                generating === 'weekly'
                  ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED', color: '#fff' }
                  : { backgroundColor: '#fff', borderColor: '#7C3AED', color: '#7C3AED' }
              }
            >
              {generating === 'weekly' ? '⏳…' : '📅 Weekly'}
            </button>
          </div>
        </div>

        {/* Generating notice */}
        {generating && (
          <div className="max-w-2xl mx-auto mt-2">
            <div className="text-xs text-center text-gray-400 bg-zinc-50 rounded-lg py-1.5 px-3">
              ✨ Claude is reading the markets… takes 15–30 seconds
            </div>
          </div>
        )}
        {genError && (
          <div className="max-w-2xl mx-auto mt-2">
            <p className="text-xs text-red-500 text-center">{genError}</p>
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="max-w-2xl mx-auto mt-2">
            <p className="text-xs text-red-500 text-center">Email failed: {sendError}</p>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-4">

        {/* History panel */}
        {historyOpen && (
          <div className="my-4 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Digest history</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Close ✕</button>
            </div>
            <div className="divide-y divide-zinc-50 max-h-64 overflow-y-auto">
              {digests.map(d => {
                const isActive = d.id === selectedId
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedId(d.id); setHistoryOpen(false) }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                    style={isActive ? { backgroundColor: '#F0FDF9' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {/* Type badge */}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={
                          d.digest_type === 'pre'
                            ? { backgroundColor: '#FEF9EC', color: '#92400E' }
                            : d.digest_type === 'weekly'
                            ? { backgroundColor: '#F5F3FF', color: '#6D28D9' }
                            : { backgroundColor: '#EEF4FF', color: '#1e40af' }
                        }
                      >
                        {d.digest_type === 'pre' ? '☀️ Pre' : d.digest_type === 'weekly' ? '📅 Weekly' : '📊 EOD'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{formatDate(d.created_at)}</div>
                        <div className="text-xs text-gray-400">{formatTime(d.created_at)}</div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>Viewing</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Digest view */}
        {selected ? (
          <DigestView
            digest={selected.content}
            digestId={selected.id}
            userId={userId}
          />
        ) : (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📰</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No digest yet</h2>
            <p className="text-gray-500 mb-6">Generate your first digest to see personalised market insights.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => generate('pre')}
                disabled={!!generating}
                className="px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#1D9E75' }}
              >
                {generating === 'pre' ? '⏳ Generating…' : '☀️ Pre-market brief'}
              </button>
              <button
                onClick={() => generate('eod')}
                disabled={!!generating}
                className="px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#378ADD' }}
              >
                {generating === 'eod' ? '⏳ Generating…' : '📊 End of day brief'}
              </button>
              <button
                onClick={() => generate('weekly')}
                disabled={!!generating}
                className="px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#7C3AED' }}
              >
                {generating === 'weekly' ? '⏳ Generating…' : '📅 Weekly roundup'}
              </button>
            </div>
            {generating && <p className="text-xs text-gray-400 mt-3">Takes 15–30 seconds — Claude is reading the markets…</p>}
            {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
