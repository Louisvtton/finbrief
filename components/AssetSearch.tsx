'use client'

import { useState, useEffect, useRef } from 'react'
import type { AssetType, WatchlistItem } from '@/types'

const TYPE_COLORS: Record<string, { border: string; bg: string }> = {
  stock:     { border: '#534AB7', bg: '#EEEDFE' },
  etf:       { border: '#3B6D11', bg: '#EAF3DE' },
  crypto:    { border: '#854F0B', bg: '#FAEEDA' },
  commodity: { border: '#993C1D', bg: '#FAECE7' },
  forex:     { border: '#993556', bg: '#FBEAF0' },
}

interface SearchResult {
  ticker: string
  name: string
  assetType: AssetType
  exchange: string
}

export default function AssetSearch({
  userId,
  existing,
  onAdd,
  onRemove,
}: {
  userId: string
  existing: WatchlistItem[]
  onAdd: (item: WatchlistItem) => void
  onRemove: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const existingTickers = new Set(existing.map(e => e.ticker))
        setResults((data.results ?? []).filter((r: SearchResult) => !existingTickers.has(r.ticker)))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [query, existing])

  const add = async (result: SearchResult) => {
    setAdding(result.ticker)
    setError('')
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ticker: result.ticker,
          name: result.name,
          assetType: result.assetType,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onAdd({
        id: data.item.id,
        ticker: data.item.ticker,
        name: data.item.name,
        assetType: data.item.asset_type,
      })
      setQuery('')
      setResults([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(null)
    }
  }

  const remove = async (id: string) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId }),
    })
    onRemove(id)
  }

  return (
    <div className="space-y-4">
      {/* Current watchlist chips */}
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map(item => {
            const style = TYPE_COLORS[item.assetType] ?? TYPE_COLORS.stock
            return (
              <div
                key={item.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
                style={{ backgroundColor: style.bg, borderColor: style.border, color: style.border }}
              >
                <span>{item.ticker}</span>
                <span className="text-xs opacity-60 font-normal max-w-[80px] truncate">{item.name}</span>
                <button
                  onClick={() => remove(item.id)}
                  className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          {searching
            ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          }
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search any stock, ETF, crypto, forex… (e.g. Apple, TSLA, BTC)"
          className="w-full border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        />
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {results.map(r => {
            const style = TYPE_COLORS[r.assetType] ?? TYPE_COLORS.stock
            const isAdding = adding === r.ticker
            return (
              <button
                key={r.ticker}
                onClick={() => add(r)}
                disabled={!!adding}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 text-left border-b border-zinc-100 last:border-0 disabled:opacity-60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-semibold shrink-0"
                    style={{ backgroundColor: style.bg, color: style.border }}
                  >
                    {r.ticker}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{r.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400 capitalize">{r.assetType}</span>
                  <span
                    className="text-xs px-2 py-1 rounded-lg text-white font-medium"
                    style={{ backgroundColor: isAdding ? '#9ca3af' : '#1D9E75' }}
                  >
                    {isAdding ? '…' : '+ Add'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {query && !searching && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">No results for "{query}" — try a ticker symbol like AAPL or BARC.L</p>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <p className="text-xs text-gray-400">
        Searches across NYSE, NASDAQ, LSE, crypto, ETFs, forex and more via Finnhub.
      </p>
    </div>
  )
}
