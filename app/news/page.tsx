'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/fetcher'
import { newsUrl } from '@/lib/news'
import { FiSearch, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiTrendingUp } from 'react-icons/fi'

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

const quickTopics = ['Climate', 'Weather', 'Environment', 'Energy', 'Ocean', 'Wildlife']

export default function NewsPage() {
  const [query, setQuery] = useState('climate')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useSWR(newsUrl(query, page), fetcher)

  const totalPages = data?.totalPages || 1
  const articles = data?.articles || []
  const featured = page === 1 ? articles[0] : null
  const gridArticles = page === 1 ? articles.slice(1) : articles

  const handleSearch = () => {
    if (searchInput.trim()) {
      setQuery(searchInput.trim())
      setSearchInput('')
      setPage(1)
    }
  }

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // No image or a broken one: show the gradient placeholder instead of an unrelated stock photo
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
    target.parentElement!.classList.add('news-image-placeholder')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10">
            <FiTrendingUp className="text-xl text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Climate News</h1>
            <p className="text-sm text-slate-400">Stay updated with the latest stories</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search topics..."
            aria-label="Search news topics"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-search pr-24"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-all active:scale-95"
          >
            Search
          </button>
        </div>

        {/* Quick Topics */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickTopics.map(topic => (
            <button
              key={topic}
              onClick={() => { setQuery(topic.toLowerCase()); setPage(1) }}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                query === topic.toLowerCase()
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-lg font-semibold text-red-400">Failed to load news</p>
          <p className="text-sm text-slate-400">Please check your connection and try again.</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !error && (
        <div className="space-y-6">
          <div className="h-72 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="space-y-3">
                <div className="h-40 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Article (Page 1 only) */}
      {featured && (
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block relative h-72 md:h-80 rounded-2xl overflow-hidden animate-slide-up"
        >
          {featured.image ? (
            <img
              src={featured.image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full news-image-placeholder" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              {featured.source?.name && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  {featured.source.name}
                </span>
              )}
              {featured.publishedAt && (
                <span className="text-xs text-white/70">{timeAgo(featured.publishedAt)}</span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
              {featured.title}
            </h2>
            {featured.description && (
              <p className="text-sm text-white/60 mt-2 line-clamp-2 hidden md:block">
                {featured.description}
              </p>
            )}
          </div>
        </a>
      )}

      {/* Articles Grid */}
      {gridArticles.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridArticles.map((article: any, i: number) => (
              // Whole card is the link - on mobile people tap the card, not a small "Read More"
              <a
                key={article.url || i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block glass-card rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Image */}
                <div className={`relative h-44 overflow-hidden ${article.image ? '' : 'news-image-placeholder'}`}>
                  {article.image && (
                    <img
                      src={article.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={handleImageError}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Time Badge */}
                  {article.publishedAt && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-medium rounded-full bg-black/40 text-white/90 backdrop-blur-md">
                      {timeAgo(article.publishedAt)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  {article.source?.name && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                      {article.source.name}
                    </span>
                  )}
                  <h3 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-blue-500 transition-colors duration-200">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  )}

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 group-hover:text-blue-400 transition-colors pt-1">
                    Read More
                    <FiArrowUpRight className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {articles.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center pt-4 pb-6">
          <div className="inline-flex items-center gap-3 p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-lg shadow-slate-200/30 dark:shadow-black/20">
            {/* Previous */}
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                         disabled:opacity-20 disabled:cursor-not-allowed
                         hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              <FiChevronLeft className="text-sm" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-bold text-blue-500">{page}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm text-slate-400">{totalPages}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-24 sm:w-32 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${(page / totalPages) * 100}%` }}
              />
            </div>

            {/* Next */}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                         disabled:opacity-20 disabled:cursor-not-allowed
                         hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            >
              <span className="hidden sm:inline">Next</span>
              <FiChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && articles.length === 0 && (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FiSearch className="text-3xl text-slate-300" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No articles found</p>
          <p className="text-sm text-slate-500">Try a different search term or topic</p>
        </div>
      )}
    </div>
  )
}
