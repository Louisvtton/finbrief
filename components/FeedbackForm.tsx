'use client'

import { useState } from 'react'

const TAGS = ['More macro', 'More crypto', 'More stocks', 'Less news', 'More depth', 'Shorter', 'More charts']

export default function FeedbackForm({
  userId,
  digestId,
  onSubmitted,
}: {
  userId: string
  digestId: string
  onSubmitted?: () => void
}) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [freetext, setFreetext] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSubmit = async () => {
    if (!stars) return
    setLoading(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, digestId, stars, tags: selectedTags, freetext }),
    })
    setLoading(false)
    setSubmitted(true)
    onSubmitted?.()
  }

  if (submitted) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.25)' }}>
        <p className="font-semibold" style={{ color: '#1D9E75' }}>Thanks! Your next digest will be better.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: '#111', borderColor: '#1A1A1A' }}>
      <h3 className="font-semibold text-white mb-4">How was today's digest?</h3>

      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(n)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span style={{ color: n <= (hovered || stars) ? '#f59e0b' : '#333' }}>★</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={
              selectedTags.includes(tag)
                ? { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                : { backgroundColor: '#1A1A1A', borderColor: '#333', color: '#888' }
            }
          >
            {tag}
          </button>
        ))}
      </div>

      <textarea
        value={freetext}
        onChange={e => setFreetext(e.target.value)}
        placeholder="Anything else? (optional)"
        rows={2}
        className="w-full text-sm rounded-lg p-3 resize-none outline-none mb-4 text-white placeholder-zinc-600 bg-transparent border"
        style={{ borderColor: '#222' }}
      />

      <button
        onClick={handleSubmit}
        disabled={!stars || loading}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#1D9E75' }}
      >
        {loading ? 'Saving…' : 'Submit feedback'}
      </button>
    </div>
  )
}
