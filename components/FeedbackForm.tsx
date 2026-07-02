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
      <div className="rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30 p-6 text-center">
        <div className="text-2xl mb-2">🙌</div>
        <p className="text-[#1D9E75] font-semibold">Thanks! Your next digest will be better.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">How was today's digest?</h3>

      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(n)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span style={{ color: n <= (hovered || stars) ? '#f59e0b' : '#d1d5db' }}>★</span>
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={
              selectedTags.includes(tag)
                ? { backgroundColor: '#378ADD', borderColor: '#378ADD', color: '#fff' }
                : { backgroundColor: '#fff', borderColor: '#d1d5db', color: '#555' }
            }
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Free text */}
      <textarea
        value={freetext}
        onChange={e => setFreetext(e.target.value)}
        placeholder="Anything else? (optional)"
        rows={2}
        className="w-full text-sm border border-zinc-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 mb-4"
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
