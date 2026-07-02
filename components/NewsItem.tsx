'use client'

import type { NewsItem as NewsItemType } from '@/types'

function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.includes('.') &&
      !['example.com', 'example.org', 'placeholder.com'].includes(parsed.hostname)
  } catch {
    return false
  }
}

export default function NewsItem({ item }: { item: NewsItemType }) {
  const date = new Date(item.publishedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const hasValidUrl = isValidUrl(item.url)

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: '#1A1A1A' }}>
      <div className="flex-1 min-w-0">
        {hasValidUrl ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline line-clamp-2"
            style={{ color: '#60a5fa' }}
          >
            {item.headline}
          </a>
        ) : (
          <span className="text-sm font-medium text-zinc-200 line-clamp-2">
            {item.headline}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500">{item.source}</span>
          <span className="text-xs text-zinc-700">·</span>
          <span className="text-xs text-zinc-500">{date}</span>
          {item.industry && (
            <>
              <span className="text-xs text-zinc-700">·</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full text-zinc-400" style={{ backgroundColor: '#1A1A1A' }}>
                {item.industry}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
