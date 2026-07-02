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
          <span className="text-sm text-gray-400">{date}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: digest.digestType === 'pre' ? '#FEF9EC' : digest.digestType === 'weekly' ? '#F5F3FF' : '#EEF4FF',
              color: digest.digestType === 'pre' ? '#92400e' : digest.digestType === 'weekly' ? '#6D28D9' : '#1e40af',
            }}>
            {digest.digestType === 'pre' ? '☀️ Pre-market' : digest.digestType === 'weekly' ? '📅 Weekly roundup' : '📊 End of day'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your Daily Briefing</h1>
      </div>

      {/* AI Summary */}
      <div className="rounded-xl bg-gradient-to-br from-[#1D9E75]/10 to-[#378ADD]/10 border border-[#1D9E75]/20 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] mb-2">AI Summary</h2>
        <p className="text-gray-700 leading-relaxed">{digest.summary}</p>
      </div>

      {/* Assets */}
      {digest.assets.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Your Watchlist</h2>
          {digest.assets.map(asset => (
            <AssetCard key={asset.ticker} asset={asset} userId={userId} />
          ))}
        </section>
      )}

      {/* Market Mood */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Market Mood</h2>
        <MarketMood mood={digest.marketMood} />
      </section>

      {/* News */}
      {digest.news.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Industry News</h2>
          <div className="rounded-xl border border-zinc-200 px-4 divide-y divide-zinc-100">
            {digest.news.map((item, i) => (
              <NewsItem key={i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Feedback */}
      {!feedbackDone && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">Feedback</h2>
          <FeedbackForm userId={userId} digestId={digestId} onSubmitted={() => setFeedbackDone(true)} />
        </section>
      )}

      <p className="text-xs text-gray-300 text-center pb-4">
        Not financial advice. Finbrief is for informational purposes only.
      </p>
    </div>
  )
}
