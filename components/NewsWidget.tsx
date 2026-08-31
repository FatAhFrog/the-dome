'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDomeSession } from '@/components/DomeSession'

type NewsItem = {
  title: string
  link: string
}

export default function NewsWidget() {
  const { profile } = useDomeSession()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const category = profile?.news_category || 'general'

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/news?category=${category}`)
      const data = await res.json()
      setItems(data.items || [])
      setLoading(false)
    }

    load()
  }, [category])

    if (loading) return <p style={{ color: 'var(--color-muted)' }}>Loading headlines — may take a few seconds...</p>
    if (items.length === 0) return <p style={{ color: 'var(--color-muted)' }}>No headlines available.</p>

  return (
    <div>
      <div style={{ borderBottom: '2px solid var(--color-text)', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
        <p style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.03em', color: 'var(--color-text)' }}>
          DAILY DOME NEWS
        </p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        {items.slice(0, 5).map((item, i) => (
          <li key={i} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : 'none', paddingTop: i > 0 ? '0.4rem' : 0, marginTop: i > 0 ? '0.4rem' : 0 }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: '0.85rem', lineHeight: 1.3 }}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
      <Link href="/apps/news" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
        Read the full paper →
      </Link>
    </div>
  )
}
