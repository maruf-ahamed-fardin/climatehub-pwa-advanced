'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/fetcher'
import { newsUrl } from '@/lib/news'
import { FiSearch, FiArrowUpRight, FiClock } from 'react-icons/fi'

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

// Unsplash keywords for news images when article has no image
const unsplashKeywords = [
  'weather,climate', 'nature,storm', 'earth,environment', 'ocean,sky',
  'forest,green', 'mountain,landscape', 'sunset,clouds', 'rain,water',
]

function getUnsplashImage(index: number, query: string) {
  const keyword = query || unsplashKeywords[index % unsplashKeywords.length]
  return `https://source.unsplash.com/800x450/?${encodeURIComponent(keyword)}&sig=${index}`
}

export default function NewsPage() {
  const [query, setQuery] = useState('climate')
  const [searchInput, setSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState<'7days' | '24hours'>('7days')

  const { data, isLoading, error } = useSWR(newsUrl(query), fetcher)

  const handleSearch = () => {
    if (searchInput.trim()) {
      setQuery(searchInput.trim())
      setSearchInput('')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search news..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="input-search"
        />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <FiSearch />
        </button>
      </div>

      {/* Tabs + Info */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('7days')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === '7days' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setActiveTab('24hours')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === '24hours' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            24 Hours
          </button>
        </div>
        <span className="text-sm text-slate-400 flex items-center gap-1">
          <FiClock className="text-xs" /> 2 min updates
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">⚠️</p>
          <p className="text-lg font-semibold text-red-400">Failed to load news</p>
          <p className="text-sm text-slate-400">Please check your connection and try again.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* News Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {data?.articles?.map((article: any, i: number) => (
          <article key={i} className="news-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
              <img
                src={article.image || getUnsplashImage(i, query)}
                alt={article.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1'
                    target.src = getUnsplashImage(i, query)
                  }
                }}
              />

              {/* Source Badge */}
              {article.source?.name && (
                <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full bg-black/50 text-white backdrop-blur-sm">
                  {article.source.name}
                </span>
              )}

              {/* Time Badge */}
              {article.publishedAt && (
                <span className="absolute top-3 right-3 px-2.5 py-1 text-xs rounded-full bg-black/50 text-white/80 backdrop-blur-sm">
                  {timeAgo(article.publishedAt)}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg leading-tight line-clamp-2">
                {article.title}
              </h3>
              {article.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {article.description}
                </p>
              )}

              {/* Read More Button */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                           text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white
                           transition-all duration-300 group"
              >
                Read More
                <FiArrowUpRight className="text-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {data && (!data.articles || data.articles.length === 0) && (
        <div className="text-center py-20">
          <p className="text-xl text-slate-400">No articles found</p>
          <p className="text-sm text-slate-500 mt-2">Try a different search term</p>
        </div>
      )}
    </div>
  )
}
