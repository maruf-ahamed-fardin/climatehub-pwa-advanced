import { NextResponse } from 'next/server'

const ARTICLES_PER_PAGE = 9

const RSS_FEEDS = [
  // when:7d limits Google News search results to the last week
  'https://news.google.com/rss/search?q={query}+when:7d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q={query}+weather+when:7d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q={query}+environment+when:7d&hl=en-US&gl=US&ceid=US:en',
  'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
]

// In-memory cache, short-lived so news stays fresh and capped so arbitrary
// search queries can't grow it without bound
const cache = new Map<string, { articles: any[], timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in ms
const CACHE_MAX_ENTRIES = 50

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function cleanText(text: string) {
  let s = text
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  s = decodeEntities(s)
  s = s.replace(/<[^>]*>/g, '')
  s = decodeEntities(s)
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))
  if (cdataMatch) return cdataMatch[1]
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  return match ? match[1] : ''
}

function extractImageFromItem(item: string, rawDesc: string): string | null {
  // Decode entities in description first - Google News RSS encodes HTML in descriptions
  const decodedDesc = decodeEntities(rawDesc)
  const decodedItem = decodeEntities(item)

  return (
    // Standard RSS media tags
    item.match(/<media:content[^>]*url="([^"]+)"/)?.[1] ||
    item.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] ||
    item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ||
    // Image from decoded description (Google News puts <img> tags here)
    decodedDesc.match(/<img[^>]*src="(https?:\/\/[^"]+)"/i)?.[1] ||
    // Image from raw description (in case CDATA was used)
    rawDesc.match(/<img[^>]*src="(https?:\/\/[^"]+)"/i)?.[1] ||
    // Any image URL in the item
    decodedItem.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i)?.[1] ||
    decodedItem.match(/url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i)?.[1] ||
    null
  )
}

// Fetch og:image from article page with timeout
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ClimateHub/1.0)' },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()
    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](https?:\/\/[^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["'](https?:\/\/[^"']+)["'][^>]*property=["']og:image["']/i)?.[1]
    return ogMatch || null
  } catch {
    return null
  }
}

function parseRSS(xml: string, feedSource: string) {
  const articles: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const title = cleanText(extractTag(item, 'title'))
    const link = cleanText(extractTag(item, 'link'))
    const rawDesc = extractTag(item, 'description')
    let description = cleanText(rawDesc)
    // Google News descriptions are often just the title + source name
    if (description.toLowerCase().startsWith(title.toLowerCase().slice(0, 40))) description = ''
    const pubDate = extractTag(item, 'pubDate')

    const source = extractTag(item, 'source') || feedSource
    // BBC feed thumbnails are 240px wide - request a size that stays sharp on phones
    const image = extractImageFromItem(item, rawDesc)?.replace('/ace/standard/240/', '/ace/standard/800/') ?? null

    if (title) {
      articles.push({
        title,
        url: link,
        description: description.slice(0, 200),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        image,
        source: { name: cleanText(source) },
      })
    }
  }

  return articles
}

// Deduplicate articles by title similarity
function deduplicateArticles(articles: any[]) {
  const seen = new Set<string>()
  return articles.filter(article => {
    const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchAllArticles(query: string): Promise<any[]> {
  // Check cache first
  const cacheKey = query.toLowerCase().trim()
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.articles
  }

  const urls = RSS_FEEDS.map(url => url.replace('{query}', encodeURIComponent(query)))
  const feedSources = ['Google News', 'Google News', 'Google News', 'BBC']

  const results = await Promise.allSettled(
    urls.map(async (url, i) => {
      const res = await fetch(url, { next: { revalidate: 1800 } }) // 30 min revalidation
      if (!res.ok) return []
      const xml = await res.text()
      return parseRSS(xml, feedSources[i])
    })
  )

  let articles = results
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  // Deduplicate articles from multiple feeds
  articles = deduplicateArticles(articles)

  // For articles without images, try fetching og:image (in parallel, max 15 at a time).
  // Google News links are JS redirects whose og:image is always the Google News logo, so skip them.
  const articlesNeedingImages = articles
    .map((a, i) => (!a.image && !a.url.startsWith('https://news.google.com/') ? i : -1))
    .filter(i => i !== -1)
    .slice(0, 15) // Limit to avoid too many requests

  if (articlesNeedingImages.length > 0) {
    const ogResults = await Promise.allSettled(
      articlesNeedingImages.map(i => fetchOgImage(articles[i].url))
    )
    ogResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        articles[articlesNeedingImages[idx]].image = result.value
      }
    })
  }

  // Store in cache, evicting the oldest entry when full (Map keeps insertion order)
  cache.delete(cacheKey)
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!)
  cache.set(cacheKey, { articles, timestamp: Date.now() })

  return articles
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'climate'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  try {
    const allArticles = await fetchAllArticles(query)
    const totalArticles = allArticles.length
    const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE))
    const currentPage = Math.min(page, totalPages)

    const start = (currentPage - 1) * ARTICLES_PER_PAGE
    const articles = allArticles.slice(start, start + ARTICLES_PER_PAGE)

    return NextResponse.json({
      articles,
      page: currentPage,
      totalPages,
      totalArticles,
    })
  } catch {
    return NextResponse.json({ articles: [], page: 1, totalPages: 1, totalArticles: 0 }, { status: 500 })
  }
}
