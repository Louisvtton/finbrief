import { createServiceClient } from './supabase'
import { getQuote, getCompanyNews, getMarketNews, getDateRange } from './finnhub'
import { getTopHeadlinesByQuery } from './newsapi'
import { generateDigestWithClaude } from './claude'
import { fetchRssFeed } from './rss-parser'
import { getYahooQuote, toYahooTicker } from './yahoo-finance'
import type { DigestContent, WatchlistItem } from '@/types'

export async function generateDigest(userId: string, digestType: 'pre' | 'eod' | 'weekly', extraNotes?: string): Promise<DigestContent> {
  const supabase = createServiceClient()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, job_role, newsletter_goal, preferred_sources')
    .eq('id', userId)
    .single()

  // Fetch watchlist
  const { data: watchlistRows } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('user_id', userId)

  const watchlist: WatchlistItem[] = (watchlistRows ?? []).map((row: any) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    assetType: row.asset_type,
  }))

  // Fetch followed industries
  const { data: industryRows } = await supabase
    .from('followed_industries')
    .select('label')
    .eq('user_id', userId)

  const industries: string[] = (industryRows ?? []).map((r: any) => r.label)

  // Fetch RSS feeds
  const { data: rssFeedRows } = await supabase
    .from('rss_feeds')
    .select('label, url')
    .eq('user_id', userId)

  // Fetch last 3 feedback entries
  const { data: feedbackRows } = await supabase
    .from('feedback')
    .select('stars, tags, freetext, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  const feedbackSummary = (feedbackRows ?? [])
    .map((f: any) => {
      const parts = []
      if (f.stars) parts.push(`${f.stars}/5 stars`)
      if (f.tags?.length) parts.push(`wanted more: ${f.tags.join(', ')}`)
      if (f.freetext) parts.push(`note: "${f.freetext}"`)
      return parts.join(' | ')
    })
    .join('\n')

  // Fetch prices and news for each asset
  const { from, to } = getDateRange()
  const assetData: Record<string, any> = {}

  await Promise.all(
    watchlist.map(async (item) => {
      try {
        const [finnhubQuote, news] = await Promise.all([
          getQuote(item.ticker),
          getCompanyNews(item.ticker, from, to),
        ])
        // Finnhub returns c:0 for unsupported tickers (e.g. European exchanges)
        // Fall back to Yahoo Finance which covers all global exchanges
        let quote = finnhubQuote
        if (!quote || quote.c === 0) {
          const yahooQuote = await getYahooQuote(toYahooTicker(item.ticker))
          if (yahooQuote) quote = yahooQuote
        }
        assetData[item.ticker] = {
          name: item.name,
          assetType: item.assetType,
          quote,
          news: news.slice(0, 3),
        }
      } catch {
        // Final fallback: still try Yahoo Finance
        try {
          const yahooQuote = await getYahooQuote(toYahooTicker(item.ticker))
          assetData[item.ticker] = {
            name: item.name,
            assetType: item.assetType,
            quote: yahooQuote ?? null,
            news: [],
          }
        } catch {
          assetData[item.ticker] = { name: item.name, assetType: item.assetType, error: 'data unavailable' }
        }
      }
    })
  )

  // Fetch market-wide news
  const marketNews = await getMarketNews('general').catch(() => [])

  // Fetch premium RSS feeds
  const rssArticles: any[] = []
  if (rssFeedRows && rssFeedRows.length > 0) {
    const results = await Promise.allSettled(
      rssFeedRows.map((f: any) => fetchRssFeed(f.url, f.label, 4))
    )
    results.forEach(r => {
      if (r.status === 'fulfilled') rssArticles.push(...r.value)
    })
  }

  // Fetch industry news from NewsAPI
  const industryNews: Record<string, any[]> = {}
  await Promise.all(
    industries.map(async (industry) => {
      try {
        const articles = await getTopHeadlinesByQuery(industry, 3, preferredSources)
        industryNews[industry] = articles
      } catch {
        industryNews[industry] = []
      }
    })
  )

  // Build prompts
  const watchlistSummary = watchlist.map(w => `${w.ticker} (${w.name}, ${w.assetType})`).join(', ') || 'none set'
  const industriesSummary = industries.join(', ') || 'none set'
  const userName = profile?.name ?? 'there'
  const jobRole = profile?.job_role ?? ''
  const newsletterGoal = profile?.newsletter_goal ?? ''
  // Parse preferred sources — fall back to Reuters + AP + BBC if none set
  const preferredSources: string[] = profile?.preferred_sources
    ? profile.preferred_sources.split(',').map((s: string) => s.trim()).filter(Boolean)
    : ['reuters', 'associated-press', 'bbc-news']

  const roleLabel: Record<string, string> = {
    retail_investor: 'a retail investor managing their own money',
    trader: 'an active trader who trades frequently',
    fund_manager: 'a fund or portfolio manager',
    financial_advisor: 'a financial advisor who advises clients',
    analyst: 'a market analyst or researcher',
    founder: 'a founder or entrepreneur',
    professional: 'a finance professional',
    curious: 'someone learning about markets',
  }
  const goalLabel: Record<string, string> = {
    daily_brief: 'stay on top of their portfolio daily',
    opportunities: 'spot investment opportunities',
    macro: 'track macro trends and global news',
    risk: 'monitor risk across their holdings',
    client_prep: 'prepare for client conversations',
    general: 'maintain general market awareness',
  }

  const digestLabel = digestType === 'pre' ? 'pre-market' : digestType === 'eod' ? 'end-of-day' : 'weekly roundup'

  const systemPrompt = digestType === 'weekly'
    ? `You are a personal finance analyst writing a weekly roundup for ${userName}.

About ${userName}:
- Role: ${roleLabel[jobRole] ?? jobRole ?? 'not specified'}
- They use Finbrief to: ${(newsletterGoal ?? '').split(', ').map((g: string) => goalLabel[g.trim()] ?? g).filter(Boolean).join(', ') || 'not specified'}

Their watchlist: ${watchlistSummary}
Their followed industries: ${industriesSummary}

Recent feedback they gave:
${feedbackSummary || 'No feedback yet.'}

Write a WEEKLY roundup — broader than a daily brief. Cover:
1. AI summary — week in review (4-5 sentences, how their portfolio fared this week overall)
2. Per-asset insight — weekly performance and outlook (2-3 sentences each, include key events of the week)
3. Industry news — biggest stories from their followed sectors this week
4. Market mood — weekly macro picture, trends to watch next week

Be analytical and forward-looking. This is the digest they read on Friday evening or Sunday to prepare for next week.
This is NOT financial advice — add a one-line disclaimer at the end.

Return ONLY a valid JSON object matching this TypeScript type (no markdown, no explanation):
{
  digestType: 'weekly',
  generatedAt: string (ISO),
  summary: string,
  assets: Array<{
    ticker: string,
    name: string,
    assetType: string,
    price: string,
    change: string,
    direction: 'up' | 'down' | 'flat',
    insight: string
  }>,
  news: Array<{
    headline: string,
    source: string,
    url: string (MUST be a real URL from the news data provided — use empty string "" if no real URL is available, never invent a URL),
    publishedAt: string,
    industry: string
  }>,
  marketMood: {
    sentiment: string,
    bullishScore: number,
    vix: number,
    sp500Change: string,
    extraIndicators: Record<string, string>
  }
}`
    : `You are a personal finance analyst writing a ${digestLabel} digest for ${userName}.

About ${userName}:
- Role: ${roleLabel[jobRole] ?? jobRole ?? 'not specified'}
- They use Finbrief to: ${(newsletterGoal ?? '').split(', ').map((g: string) => goalLabel[g.trim()] ?? g).filter(Boolean).join(', ') || 'not specified'}

Their watchlist: ${watchlistSummary}
Their followed industries: ${industriesSummary}

Recent feedback they gave:
${feedbackSummary || 'No feedback yet.'}

Tailor the depth, tone, and focus of your digest to their role and goals. Use this feedback to further adjust.

Write a digest with these sections:
1. AI summary (3-4 sentences, personal and specific to their holdings)
2. Per-asset insight (1-2 sentences per asset, data-driven)
3. Industry news summary (brief bullets per industry)
4. Market mood (overall sentiment, key macro numbers)

Be conversational, specific, and avoid generic market commentary.
This is NOT financial advice — add a one-line disclaimer at the end.

Return ONLY a valid JSON object matching this TypeScript type (no markdown, no explanation):
{
  digestType: '${digestType}',
  generatedAt: string (ISO),
  summary: string,
  assets: Array<{
    ticker: string,
    name: string,
    assetType: string,
    price: string,
    change: string,
    direction: 'up' | 'down' | 'flat',
    insight: string
  }>,
  news: Array<{
    headline: string,
    source: string,
    url: string (MUST be a real URL from the news data provided — use empty string "" if no real URL is available, never invent a URL),
    publishedAt: string,
    industry: string
  }>,
  marketMood: {
    sentiment: string,
    bullishScore: number,
    vix: number,
    sp500Change: string,
    extraIndicators: Record<string, string>
  }
}`

  const userPrompt = `Current data as of ${new Date().toISOString()}:

ASSET PRICES & NEWS:
${JSON.stringify(assetData, null, 2)}

MARKET NEWS:
${JSON.stringify(marketNews.slice(0, 5), null, 2)}

INDUSTRY NEWS:
${JSON.stringify(industryNews, null, 2)}${rssArticles.length > 0 ? `

PREMIUM RSS ARTICLES (from user's own subscriptions — treat as high-priority, trusted sources):
${JSON.stringify(rssArticles, null, 2)}` : ''}${extraNotes ? `

USER'S ADDITIONAL FOCUS FOR THIS BRIEF:
${extraNotes}

Please give extra attention to the above when writing insights and the summary.` : ''}`

  return generateDigestWithClaude(systemPrompt, userPrompt)
}
