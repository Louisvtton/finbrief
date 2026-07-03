import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { fetchRssFeed } from '@/lib/rss-parser'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { userId, customTopic, briefType = 'daily' } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('newsletter_goal, extra_context, name')
      .eq('id', userId)
      .single()

    // Fetch RSS feeds
    const { data: feeds } = await supabase
      .from('rss_feeds')
      .select('label, url')
      .eq('user_id', userId)

    if (!feeds || feeds.length === 0) {
      return NextResponse.json({ error: 'No RSS feeds connected. Add subscriptions in Settings.' }, { status: 400 })
    }

    // Weekly brief fetches more articles (7 days via higher limit)
    const maxItems = briefType === 'weekly' ? 20 : 10

    // Fetch articles from all feeds in parallel
    const articlesByFeed = await Promise.allSettled(
      feeds.map(f => fetchRssFeed(f.url, f.label, maxItems))
    )

    const allArticles = articlesByFeed
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any>).value)

    if (allArticles.length === 0) {
      return NextResponse.json({ error: 'No recent articles found in your feeds. Try again later.' }, { status: 400 })
    }

    const topicsContext = customTopic
      ? `The user wants a brief specifically about: "${customTopic}"`
      : `The user's topics of interest: ${profile?.newsletter_goal || 'general finance and markets'}`

    const extraContext = profile?.extra_context
      ? `Background on this user: ${profile.extra_context}`
      : ''

    const articleList = allArticles.map((a, i) =>
      `[${i + 1}] Source: ${a.source}\nHeadline: ${a.headline}\nSummary: ${a.summary || 'No summary available'}`
    ).join('\n\n')

    const isWeekly = briefType === 'weekly'
    const prompt = `You are a financial analyst writing a personalised reading digest.

${topicsContext}
${extraContext}

Here are the latest articles from the user's subscriptions:

${articleList}

Your task:
1. Select ${isWeekly ? '6-10' : '3-6'} articles that are most relevant to the user's interests${customTopic ? ` and the topic "${customTopic}"` : ''}
2. For each selected article, write a 2-3 sentence summary explaining what it says and why it matters to this user
3. Write a short opening paragraph (${isWeekly ? '3-4' : '2-3'} sentences) summarising ${isWeekly ? "the week's key themes" : "today's key themes"}

${isWeekly ? 'This is a WEEKLY roundup — look for the week\'s biggest stories and patterns across publications. Connect themes across articles. Be more analytical and forward-looking.' : ''}

Return valid JSON only, no markdown fences:
{
  "headline": "short title for this brief (e.g. '${isWeekly ? 'Your weekly read' : 'Your morning read'}' or 'Oil markets brief')",
  "opening": "${isWeekly ? '3-4' : '2-3'} sentence narrative overview of ${isWeekly ? "the week's themes" : "today's themes"}",
  "articles": [
    {
      "source": "publication name",
      "title": "article headline",
      "url": "article url",
      "summary": "2-3 sentence summary and why it matters",
      "tag": "one topic tag e.g. Macro, Oil, Equities"
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text as string
    let content: any
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      content = JSON.parse(raw.slice(start, end + 1))
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 })
    }

    const digestType = customTopic ? 'reader_custom' : briefType === 'weekly' ? 'reader_weekly' : 'reader'

    const { data, error } = await supabase
      .from('digests')
      .insert({
        user_id: userId,
        digest_type: digestType,
        content: { ...content, customTopic: customTopic || null },
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ digestId: data.id, content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
