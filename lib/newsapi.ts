const NEWSAPI_BASE = 'https://newsapi.org/v2'
const apiKey = process.env.NEWS_API_KEY!

export interface NewsApiArticle {
  title: string
  source: { name: string }
  url: string
  publishedAt: string
  description: string | null
}

export async function getTopHeadlinesByQuery(
  query: string,
  pageSize = 5,
  sources?: string[]   // NewsAPI source ids e.g. ['reuters', 'bbc-news']
): Promise<NewsApiArticle[]> {
  const url = new URL(`${NEWSAPI_BASE}/everything`)
  url.searchParams.set('q', query)
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('language', 'en')
  url.searchParams.set('apiKey', apiKey)
  // NewsAPI allows up to 20 sources per request
  if (sources && sources.length > 0) {
    url.searchParams.set('sources', sources.slice(0, 20).join(','))
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`NewsAPI failed for "${query}": ${res.status}`)
  const data = await res.json()
  return data.articles ?? []
}
