const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const token = process.env.FINNHUB_API_KEY!

export interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // percent change
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
}

export interface FinnhubNewsItem {
  headline: string
  source: string
  url: string
  datetime: number
  summary: string
}

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${token}`)
  if (!res.ok) throw new Error(`Finnhub quote failed for ${symbol}: ${res.status}`)
  return res.json()
}

export async function getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubNewsItem[]> {
  const res = await fetch(
    `${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${token}`
  )
  if (!res.ok) throw new Error(`Finnhub news failed for ${symbol}: ${res.status}`)
  return res.json()
}

export async function getMarketNews(category: string = 'general'): Promise<FinnhubNewsItem[]> {
  const res = await fetch(`${FINNHUB_BASE}/news?category=${category}&token=${token}`)
  if (!res.ok) throw new Error(`Finnhub market news failed: ${res.status}`)
  return res.json()
}

// Returns today and 7 days ago as YYYY-MM-DD strings
export function getDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 7)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}
