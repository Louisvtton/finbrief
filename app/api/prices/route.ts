import { NextRequest, NextResponse } from 'next/server'
import { getQuote } from '@/lib/finnhub'

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols')
  if (!symbols) return NextResponse.json({ error: 'symbols query param required' }, { status: 400 })

  const tickers = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

  const results = await Promise.allSettled(tickers.map(t => getQuote(t)))

  const prices: Record<string, any> = {}
  tickers.forEach((ticker, i) => {
    const result = results[i]
    prices[ticker] = result.status === 'fulfilled'
      ? result.value
      : { error: 'unavailable' }
  })

  return NextResponse.json({ prices })
}
