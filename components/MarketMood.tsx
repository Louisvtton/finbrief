'use client'

import type { MarketMood as MarketMoodType } from '@/types'

export default function MarketMood({ mood }: { mood: MarketMoodType }) {
  const score = Math.max(0, Math.min(100, mood.bullishScore))
  const color = score >= 60 ? '#1D9E75' : score >= 40 ? '#f59e0b' : '#e53e3e'

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
      <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wide mb-3">Market Mood</h3>

      <p className="text-gray-700 text-sm mb-4 leading-relaxed">{mood.sentiment}</p>

      {/* Bullish score bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Bearish</span>
          <span className="font-semibold" style={{ color }}>{score}/100</span>
          <span>Bullish</span>
        </div>
        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Key indicators */}
      <div className="grid grid-cols-3 gap-3">
        <Indicator label="S&P 500" value={mood.sp500Change} />
        <Indicator label="VIX" value={String(mood.vix)} />
        {Object.entries(mood.extraIndicators ?? {}).slice(0, 1).map(([k, v]) => (
          <Indicator key={k} label={k} value={v} />
        ))}
      </div>
    </div>
  )
}

function Indicator({ label, value }: { label: string; value: string }) {
  const isPositive = value.startsWith('+')
  const isNegative = value.startsWith('-')
  const color = isPositive ? '#1D9E75' : isNegative ? '#e53e3e' : '#374151'
  return (
    <div className="text-center bg-white rounded-lg p-2 border border-zinc-100">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-semibold" style={{ color }}>{value}</div>
    </div>
  )
}
