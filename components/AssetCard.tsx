'use client'

import { useState } from 'react'
import type { AssetDigestItem, AssetType } from '@/types'

const assetStyles: Record<AssetType, { accent: string; label: string }> = {
  stock:     { accent: '#534AB7', label: 'Stock' },
  etf:       { accent: '#3B6D11', label: 'ETF' },
  crypto:    { accent: '#C47A1E', label: 'Crypto' },
  commodity: { accent: '#993C1D', label: 'Commodity' },
  forex:     { accent: '#993556', label: 'Forex' },
}

function externalUrl(ticker: string, assetType: AssetType): string {
  if (assetType === 'crypto') {
    const base = ticker.replace('-USD', '').replace('-USDT', '').toLowerCase()
    return `https://www.coingecko.com/en/coins/${base}`
  }
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
      style={{ backgroundColor: '#111', borderLeft: `4px solid ${style.accent}`, border: `1px solid #1A1A1A`, borderLeftColor: style.accent, borderLeftWidth: '4px' }}
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-base text-white">{asset.ticker}</span>
              <span className="text-sm text-zinc-400 truncate max-w-[160px]">{asset.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: style.accent + '22', color: style.accent }}
              >
                {style.label}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{asset.insight}</p>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            {hasPrice ? (
              <>
                <div className="font-semibold text-base text-white">{asset.price}</div>
                <div className="text-sm font-medium" style={{ color: directionColor }}>
                  {arrow} {asset.change}
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-500 italic leading-tight text-right">
                Data<br />unavailable
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: style.accent }}
        >
          <span className="transition-transform inline-block" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
          {expanded ? 'Less' : 'More info'}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-1 border-t space-y-3"
          style={{ borderColor: '#222' }}
        >
          {hasPrice && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Price', value: asset.price },
                { label: 'Change', value: `${arrow} ${asset.change}` },
              ].map(item => (
                <div key={item.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: '#1A1A1A' }}>
                  <div className="text-zinc-500 mb-0.5">{item.label}</div>
                  <div className="font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {!hasPrice && (
            <div className="text-xs text-zinc-500 rounded-lg px-3 py-2" style={{ backgroundColor: '#1A1A1A' }}>
              Live price data isn't available for this ticker right now. The AI insight above is still based on recent news.
            </div>
          )}

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
                    : { backgroundColor: '#222', color: '#ccc' }
                }
              >
                {emailStatus === 'sending' ? 'Generating report…' :
                 emailStatus === 'sent' ? 'Report sent!' :
                 emailStatus === 'error' ? 'Failed' :
                 'Email me about this'}
              </button>
            )}
            <a
              href={externalUrl(asset.ticker, asset.assetType)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: style.accent }}
            >
              {asset.assetType === 'crypto' ? 'CoinGecko' : 'Yahoo Finance'} ↗
            </a>
            <a
              href={googleNewsUrl(asset.ticker, asset.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors"
              style={{ borderColor: '#333', color: '#888' }}
            >
              Latest news ↗
            </a>
            {asset.assetType === 'stock' && (
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(asset.ticker)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-colors"
                style={{ borderColor: '#333', color: '#888' }}
              >
                TradingView ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
