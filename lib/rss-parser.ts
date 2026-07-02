export interface RssArticle {
  headline: string
  url: string
  source: string
  publishedAt: string
  summary: string
}

function extractTag(xml: string, tag: string): string {
  // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 'is')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString()
  try {
    return new Date(raw).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function isRecent(isoDate: string, hoursBack = 48): boolean {
  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    return diff < hoursBack * 60 * 60 * 1000
  } catch {
    return true
  }
}

export async function fetchRssFeed(url: string, label: string, maxItems = 5): Promise<RssArticle[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Finbrief/1.0 RSS Reader' },
    next: { revalidate: 1800 }, // cache 30 min
  })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const xml = await res.text()

  const articles: RssArticle[] = []

  // Detect format: RSS 2.0 uses <item>, Atom uses <entry>
  const isAtom = xml.includes('<feed') && xml.includes('<entry')
  const itemTag = isAtom ? 'entry' : 'item'

  // Split into individual items
  const itemRe = new RegExp(`<${itemTag}[\\s>]([\\s\\S]*?)<\\/${itemTag}>`, 'gi')
  let match: RegExpExecArray | null
  while ((match = itemRe.exec(xml)) !== null && articles.length < maxItems) {
    const block = match[1]

    const headline = extractTag(block, 'title')
    const summary = extractTag(block, 'description') ||
                    extractTag(block, 'summary') ||
                    extractTag(block, 'content')

    // URL: <link> in RSS, <link href="..."> in Atom
    let articleUrl = ''
    if (isAtom) {
      articleUrl = extractAttr(block, 'link', 'href')
    } else {
      articleUrl = extractTag(block, 'link')
      // some RSS feeds put the URL directly between tags without CDATA
      if (!articleUrl) {
        const linkM = block.match(/<link>(.*?)<\/link>/i)
        if (linkM) articleUrl = linkM[1].trim()
      }
    }

    const rawDate = extractTag(block, 'pubDate') ||
                    extractTag(block, 'published') ||
                    extractTag(block, 'updated') ||
                    extractTag(block, 'dc:date')
    const publishedAt = parseDate(rawDate)

    if (!headline || !isRecent(publishedAt)) continue

    // Strip HTML tags from summary
    const cleanSummary = summary
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300)

    articles.push({
      headline: headline.replace(/<[^>]+>/g, '').trim(),
      url: articleUrl,
      source: label,
      publishedAt,
      summary: cleanSummary,
    })
  }

  return articles
}
