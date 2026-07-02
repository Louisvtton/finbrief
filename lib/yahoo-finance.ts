import type { FinnhubQuote } from './finnhub'

// Yahoo Finance v8 chart API — free, no key needed, supports all exchanges
// including European (.PA, .WA, .L, .DE etc.) and crypto (BTC-USD etc.)
export async function getYahooQuote(ticker: string): Promise<FinnhubQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta || !meta.regularMarketPrice) return null

    const current = meta.regularMarketPrice
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? current
    const change = current - prev
    const changePct = prev !== 0 ? (change / prev) * 100 : 0

    return {
      c: current,
      d: change,
      dp: changePct,
      h: meta.regularMarketDayHigh ?? current,
      l: meta.regularMarketDayLow ?? current,
      o: meta.regularMarketOpen ?? current,
      pc: prev,
    }
  } catch {
    return null
  }
}

// Convert ticker to Yahoo Finance format if needed
// e.g. crypto: BTC → BTC-USD, BTCUSD → BTC-USD
export function toYahooTicker(ticker: string): string {
  // Already has exchange suffix — pass through
  if (ticker.includes('.') || ticker.includes('-')) return ticker
  // Finnhub crypto format: BINANCE:BTCUSDT → BTC-USD
  if (ticker.includes(':')) {
    const base = ticker.split(':')[1]
    if (base.endsWith('USDT')) return base.replace('USDT', '') + '-USD'
    if (base.endsWith('USD')) return base.slice(0, -3) + '-USD'
    return base
  }
  return ticker
}
