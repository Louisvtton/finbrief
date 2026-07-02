'use client'

import { useState } from 'react'

export default function GenerateDigestButton({
  userId,
  compact = false,
}: {
  userId: string
  compact?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, digestType: 'pre' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      // Full reload so the server component fetches the new digest from DB
      window.location.href = '/digest'
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#1D9E75' }}
        >
          {loading ? '⏳ Generating…' : '✨ New digest'}
        </button>
        {error && (
          <p className="text-xs text-red-500 max-w-[200px] text-right">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 flex flex-col items-center">
      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#1D9E75' }}
      >
        {loading ? '⏳ Generating your digest…' : '✨ Generate my first digest'}
      </button>
      {loading && (
        <p className="text-xs text-gray-400">Takes 15–30 seconds — Claude is reading the markets…</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
