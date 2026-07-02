export type AssetType = 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex'

export interface WatchlistItem {
  id: string
  ticker: string
  name: string
  assetType: AssetType
}

export interface DigestContent {
  digestType: 'pre' | 'eod' | 'weekly'
  generatedAt: string
  summary: string
  assets: AssetDigestItem[]
  news: NewsItem[]
  marketMood: MarketMood
}

export interface AssetDigestItem {
  ticker: string
  name: string
  assetType: AssetType
  price: string
  change: string
  direction: 'up' | 'down' | 'flat'
  insight: string
}

export interface NewsItem {
  headline: string
  source: string
  url: string
  publishedAt: string
  industry: string
}

export interface MarketMood {
  sentiment: string
  bullishScore: number   // 0-100
  vix: number
  sp500Change: string
  extraIndicators: Record<string, string>
}

export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  frequency: 'daily' | '2x' | 'weekly'
  digest_time: 'pre' | 'eod' | 'both'
  created_at: string
}

export interface FeedbackEntry {
  id: string
  user_id: string
  digest_id: string | null
  stars: number | null
  tags: string[] | null
  freetext: string | null
  created_at: string
}
