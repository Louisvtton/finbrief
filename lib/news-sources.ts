export interface NewsSource {
  id: string          // NewsAPI source id
  name: string
  description: string
  category: 'wire' | 'business' | 'general' | 'markets'
  flag?: string       // country flag emoji
}

export const NEWS_SOURCES: NewsSource[] = [
  // Wire services — most neutral/unbiased
  { id: 'reuters',           name: 'Reuters',          description: 'Global wire service — fastest, most neutral',        category: 'wire',     flag: '🌐' },
  { id: 'associated-press',  name: 'AP News',          description: 'US wire service — unbiased, fact-first reporting',   category: 'wire',     flag: '🌐' },

  // Business & markets
  { id: 'bloomberg',         name: 'Bloomberg',        description: 'Deep market coverage and financial data',            category: 'markets',  flag: '🇺🇸' },
  { id: 'cnbc',              name: 'CNBC',             description: 'US markets, earnings, and Wall Street news',         category: 'markets',  flag: '🇺🇸' },
  { id: 'marketwatch',       name: 'MarketWatch',      description: 'Stock markets, personal finance, US focus',          category: 'markets',  flag: '🇺🇸' },
  { id: 'business-insider',  name: 'Business Insider', description: 'Business, tech, and markets — accessible tone',     category: 'business', flag: '🇺🇸' },
  { id: 'fortune',           name: 'Fortune',          description: 'Business strategy, CEO interviews, economy',         category: 'business', flag: '🇺🇸' },
  { id: 'axios',             name: 'Axios',            description: 'Concise briefings on business and politics',         category: 'business', flag: '🇺🇸' },

  // General / international
  { id: 'bbc-news',          name: 'BBC News',         description: 'Trusted UK public broadcaster — global coverage',   category: 'general',  flag: '🇬🇧' },
  { id: 'the-guardian-uk',   name: 'The Guardian',     description: 'UK quality journalism — progressive lean',           category: 'general',  flag: '🇬🇧' },
  { id: 'the-telegraph',     name: 'The Telegraph',    description: 'UK business and politics — centre-right',            category: 'general',  flag: '🇬🇧' },
  { id: 'le-monde',          name: 'Le Monde',         description: 'French paper of record — European perspective',     category: 'general',  flag: '🇫🇷' },
]

export const DEFAULT_SOURCES = ['reuters', 'associated-press', 'bbc-news']

export const CATEGORY_LABELS: Record<NewsSource['category'], string> = {
  wire:     '📡 Wire services',
  markets:  '📈 Markets & finance',
  business: '💼 Business',
  general:  '🌍 International',
}
