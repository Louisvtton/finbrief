'use client'

import { useState } from 'react'
import type { AssetDigestItem, AssetType } from '@/types'

const assetStyles: Record<AssetType, { border: string; bg: string; label: string }> = {
  stock:     { border: '#534AB7', bg: '#EEEDFE', label: 'Stock' },
  etf:       { border: '#3B6D11', bg: '#EAF3DE', label: 'ETF' },
  crypto:    { border: '#854F0B', bg: '#FAEEDA', label: 'Crypto' },
  commodity: { border: '#993C1D', bg: '#FAECE7', label: 'Commodity' },
  forex:     { border: '#993556', bg: '#FBEAF0', label: 'Forex' },
}

// Build a sensible external link for the asset
function externalUrl(ticker: string, assetType: AssetType): string {
  if (assetType === 'crypto') {
    const base = ticker.replace('-USD', '').replace('-USDT', '').toLowerCase()
    return `https://www.coingecko.com/en/coins/${base}`
  }
  if (assetType === 'commodity') {
    return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`
  }
  if (assetType === 'forex') {
    return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`
  }
  // Stocks / ETFs — prefer Yahoo Finance (covers global exchanges)
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`
}

function googleNewsUrl(ticker: string, name: string): string {
  const q = encodeURIComponent(`${name} ${ticker} stock`)
  return `https://news.google.com/search?q=${q}`
}

export default function AssetCard({ asset, userId }: { asset: AssetDigestItem; userId?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const style = assetStyles[asset.assetType] ?? assetStyles.stock
  const directionColor =
    asset.direction === 'up' ? '#1D9E75' : asset.direction === 'down' ? '#e53e3e' : '#888'
  const arrow = asset.direction === 'up' ? '▲' : asset.direction === 'down' ? '▼' : '–'

  const hasPrice = asset.price && asset.price !== '—' && asset.price !== 'N/A'

  return (
    <div
      className="rounded-xl mb-3 overflow-hidden transition-all"
      style={{ backgroundColor: style.bg, borderLeft: `4px solid ${style.border}` }}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-base">{asset.ticker}</span>
              <span className="text-sm text-gray-500 truncate max-w-[160px]">{asset.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: style.border + '22', color: style.border }}
              >
                {style.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{asset.insight}</p>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            {hasPrice ? (
              <>
                <div className="font-semibold text-base">{asset.price}</div>
                <div className="text-sm font-medium" style={{ color: directionColor }}>
                  {arrow} {asset.change}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 italic leading-tight text-right">
                Data<br />unavailable
              </div>
            )}
          </div>
        </div>

        {/* More / Less toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: style.border }}
        >
          <span className="transition-transform inline-block" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
          {expanded ? 'Less' : 'More info'}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-1 border-t space-y-3"
          style={{ borderColor: style.border + '33' }}
        >
          {/* Price detail row */}
          {hasPrice && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Price', value: asset.price },
                { label: 'Change', value: `${arrow} ${asset.change}` },
              ].map(item => (
                <div key={item.label} className="bg-white/60 rounded-lg px-3 py-2">
                  <div className="text-gray-400 mb-0.5">{item.label}</div>
                  <div className="font-semibold text-gray-800">{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {!hasPrice && (
            <div className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2">
              ⚠️ Live price data isn't available for this ticker right now. This can happen with some smaller exchanges or after market hours. The AI insight above is still based on recent news.
            </div>
          )}

          {/* Email report + External links */}
          <div className="flex flex-wrap gap-2">
            {userId && (
              <button
                onClick={async () => {
                  setEmailStatus('sending')
                  try {
                    const res = await fetch('/api/digest/send-asset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, ticker: asset.ticker, name: asset.name, assetType: asset.assetType }),
                    })
                    if (!res.ok) throw new Error()
                    setEmailStatus('sent')
                    setTimeout(() => setEmailStatus('idle'), 4000)
                  } catch {
                    setEmailStatus('error')
                    setTimeout(() => setEmailStatus('idle'), 3000)
                  }
                }}
                disabled={emailStatus === 'sending'}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-opacity disabled:opacity-50"
                style={
                  emailStatus === 'sent'
                    ? { backgroundColor: '#1D9E75', color: '#fff' }
                    : emailStatus === 'error'
                    ? { backgroundColor: '#e53e3e', color: '#fff' }
                    : { backgroundColor: '#1a1a1a', color: '#fff' }
                }
              >
                {emailStatus === 'sending' ? '📤 Generating report…' :
                 emailStatus === 'sent' ? '✓ Report sent!' :
                 emailStatus === 'error' ? 'Failed' :
                 '📧 Email me about this'}
              </button>
            )}
            <a
              href={externalUrl(asset.ticker, asset.assetType)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: style.border }}
            >
              {asset.assetType === 'crypto' ? '🪙 CoinGecko' : '📊 Yahoo Finance'} ↗
            </a>
            <a
              href={googleNewsUrl(asset.ticker, asset.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors hover:bg-white/60"
              style={{ borderColor: style.border + '66', color: style.border }}
            >
              🗞 Latest news ↗
            </a>
            {asset.assetType === 'stock' && (
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(asset.ticker)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors hover:bg-white/60"
                style={{ borderColor: style.border + '66', color: style.border }}
              >
                📈 TradingView chart ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
