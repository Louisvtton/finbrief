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
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        {hasValidUrl ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#378ADD] hover:underline line-clamp-2"
          >
            {item.headline}
          </a>
        ) : (
          <span className="text-sm font-medium text-gray-800 line-clamp-2">
            {item.headline}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{item.source}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">{date}</span>
          {item.industry && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">
                {item.industry}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
