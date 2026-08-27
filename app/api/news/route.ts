import { NextResponse } from 'next/server'

const FEEDS: Record<string, string> = {
  general: 'https://feeds.npr.org/1001/rss.xml',
  gaming: 'https://www.reddit.com/r/gaming/.rss',
  warhammer: 'https://www.reddit.com/r/Warhammer40k/.rss',
}

const decodeEntities = (str: string) =>
  str
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '').trim()

  type CacheEntry = { items: { title: string; link: string; thumbnail: string | null; blurb: string }[]; timestamp: number }
const cache: Record<string, CacheEntry> = {}
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'
  const feedUrl = FEEDS[category] || FEEDS.general

  const cached = cache[category]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ items: cached.items })
  }

  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TheDomeApp/1.0 (personal friend-group hub app)' },
    })
    const xml = await res.text()

    const items = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>|<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 10)
      .map((match) => {
        const block = match[1] || match[2]
        const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || 'Untitled'
        const linkTag = block.match(/<link[^>]*href="([^"]*)"/) || block.match(/<link>([\s\S]*?)<\/link>/)
        const link = linkTag?.[1] || '#'
        const thumbnail = block.match(/<media:thumbnail[^>]*url="([^"]*)"/)?.[1] || null
        const descMatch = block.match(/<description[^>]*>([\s\S]*?)<\/description>/) || block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)
        const rawBlurb = descMatch?.[1] || ''
        const cleanedBlurb = decodeEntities(stripHtml(rawBlurb.replace('<![CDATA[', '').replace(']]>', '')))
        const blurb = cleanedBlurb.length > 160 ? cleanedBlurb.slice(0, 157).trim() + '...' : cleanedBlurb || 'Read the full story at the source.'
        return {
          title: decodeEntities(title.replace('<![CDATA[', '').replace(']]>', '').trim()),
          link: link.trim(),
          thumbnail,
          blurb,
        }
      })

    return NextResponse.json({ items })
  } catch {
    // If we have stale cache, serve it rather than nothing
    if (cached) return NextResponse.json({ items: cached.items })
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}