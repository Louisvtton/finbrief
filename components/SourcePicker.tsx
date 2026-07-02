'use client'

import { NEWS_SOURCES, CATEGORY_LABELS, DEFAULT_SOURCES } from '@/lib/news-sources'
import type { NewsSource } from '@/lib/news-sources'

export default function SourcePicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (sources: string[]) => void
}) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    )
  }

  // Group by category
  const categories = ['wire', 'markets', 'business', 'general'] as NewsSource['category'][]

  return (
    <div className="space-y-5">
      {categories.map(cat => {
        const sources = NEWS_SOURCES.filter(s => s.category === cat)
        return (
          <div key={cat}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="space-y-2">
              {sources.map(src => {
                const isSelected = selected.includes(src.id)
                const isDefault = DEFAULT_SOURCES.includes(src.id)
                return (
                  <button
                    key={src.id}
                    onClick={() => toggle(src.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                    style={
                      isSelected
                        ? { backgroundColor: '#E8F7F1', borderColor: '#1D9E75', color: '#1C1C1C' }
                        : { backgroundColor: '#FAFAF8', borderColor: '#E5E0D8', color: '#4B5563' }
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{src.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{src.name}</span>
                          {isDefault && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: '#E8F7F1', color: '#1D9E75', border: '1px solid #1D9E75' + '44' }}>
                              default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{src.description}</p>
                      </div>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                      style={
                        isSelected
                          ? { backgroundColor: '#1D9E75', borderColor: '#1D9E75' }
                          : { backgroundColor: '#fff', borderColor: '#D1CBC0' }
                      }
                    >
                      {isSelected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selected.length === 0 && (
        <p className="text-xs text-center text-gray-400 py-2">
          Nothing selected — we'll use Reuters, AP News & BBC by default.
        </p>
      )}

      {selected.length > 0 && (
        <p className="text-xs text-center text-gray-400 py-1">
          {selected.length} source{selected.length > 1 ? 's' : ''} selected
          {' · '}
          <button
            onClick={() => onChange([])}
            className="underline hover:text-gray-600 transition-colors"
          >
            reset to default
          </button>
        </p>
      )}
    </div>
  )
}
