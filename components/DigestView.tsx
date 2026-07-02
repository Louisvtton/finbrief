'use client'

import { useState } from 'react'
import AssetCard from './AssetCard'
import NewsItem from './NewsItem'
import MarketMood from './MarketMood'
import FeedbackForm from './FeedbackForm'
import type { DigestContent } from '@/types'

export default function DigestView({
  digest,
  digestId,
  userId,
}: {
  digest: DigestContent
  digestId: string
  userId: string
}) {
  const [feedbackDone, setFeedbackDone] = useState(false)

  const date = new Date(digest.generatedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-zinc-500">{date}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
            style={
              digest.digestType === 'pre'
                ? { backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75' }
                : digest.digestType === 'weekly'
                ? { backgroundColor: 'rgba(124,58,237,0.15)', color: '#a78bfa' }
                : { backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa' }
            }>
            {digest.digestType === 'pre' ? 'Pre-market' : digest.digestType === 'weekly' ? 'Weekly roundup' : 'End of day'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Your Daily Briefing</h1>
      </div>

      {/* AI Summary */}
      <div className="rounded-xl bg-gradient-to-br from-[#1D9E75]/10 to-[#378ADD]/10 border border-[#1D9E75]/20 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] mb-2">AI Summary</h2>
        <p className="text-zinc-300 leading-relaxed">{digest.summary}</p>
      </div>

      {/* Assets */}
      {digest.assets.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Your Watchlist</h2>
          {digest.assets.map(asset => (
            <AssetCard key={asset.ticker} asset={asset} userId={userId} />
          ))}
        </section>
      )}

      {/* Market Mood */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Market Mood</h2>
        <MarketMood mood={digest.marketMood} />
      </section>

      {/* News */}
      {digest.news.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Industry News</h2>
          <div className="rounded-xl border px-4 divide-y" style={{ borderColor: '#1A1A1A' }}>
            {digest.news.map((item, i) => (
              <NewsItem key={i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Feedback */}
      {!feedbackDone && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Feedback</h2>
          <FeedbackForm userId={userId} digestId={digestId} onSubmitted={() => setFeedbackDone(true)} />
        </section>
      )}

      <p className="text-xs text-gray-300 text-center pb-4">
        Not financial advice. Finbrief is for informational purposes only.
      </p>
    </div>
  )
}
