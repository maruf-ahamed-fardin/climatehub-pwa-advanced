import { NextResponse } from 'next/server'

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en',
  'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
]

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

function parseRSS(xml: string, feedSource: string) {
  const articles: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const title = cleanText(extractTag(item, 'title'))
    const link = cleanText(extractTag(item, 'link'))
    const rawDesc = extractTag(item, 'description')
    const description = cleanText(rawDesc)
    const pubDate = extractTag(item, 'pubDate')

    const source = extractTag(item, 'source') || feedSource
    const image =
      item.match(/<media:content[^>]*url="([^"]+)"/)?.[1] ||
      item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ||
      rawDesc.match(/<img[^>]*src="(https?:\/\/[^"]+)"/i)?.[1] ||
      item.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1] ||
      null

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'climate'

  try {
    const urls = RSS_FEEDS.map(url => url.replace('{query}', encodeURIComponent(query)))

    const results = await Promise.allSettled(
      urls.map(async (url, i) => {
        const res = await fetch(url, { next: { revalidate: 300 } })
        if (!res.ok) return []
        const xml = await res.text()
        return parseRSS(xml, i === 0 ? 'Google News' : 'BBC')
      })
    )

    const articles = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20)

    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] }, { status: 500 })
  }
}
