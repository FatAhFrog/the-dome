'use client'

import { useState, useEffect } from 'react'
import { useDomeSession } from '@/components/DomeSession'

type NewsItem = {
  title: string
  link: string
  thumbnail: string | null
  blurb: string
}

const CATEGORIES = [
  { value: 'general', label: 'General News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'warhammer', label: 'Warhammer 40K' },
]

export default function NewsPage() {
  const { profile } = useDomeSession()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(profile?.news_category || 'general')
  const newsEnabled = profile?.news_enabled ?? true

  useEffect(() => {
    setLoading(true)
    fetch(`/api/news?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category])

  if (!newsEnabled) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1 style={{ color: '#EB4600' }}>News</h1>
        <p style={{ color: '#666' }}>
          News is turned off. You can re-enable it from your{' '}
          <a href="/profile" style={{ color: '#EB4600' }}>
            Profile
          </a>
          .
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', borderBottom: '4px solid #1A1A1A', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.2em', color: '#666' }}>THE DOME PRESENTS</p>
        <h1 style={{ margin: '0.1rem 0', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '3rem', fontWeight: 900, letterSpacing: '0.02em', color: '#1A1A1A' }}>
          DAILY DOME NEWS
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', fontFamily: 'Georgia, serif' }}>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>{CATEGORIES.find((c) => c.value === category)?.label.toUpperCase()} EDITION</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.4rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.85rem' }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: '#999' }}>Loading headlines — may take a few seconds...</p>}
      {!loading && items.length === 0 && <p style={{ color: '#999' }}>No headlines available.</p>}

      {!loading && items.length > 0 && (
        <>
          <a
            href={items[0].link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', gap: '1.5rem', textDecoration: 'none', color: '#1A1A1A', borderBottom: '2px solid #1A1A1A', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}
          >
            {items[0].thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={items[0].thumbnail} alt="" style={{ width: '220px', height: '160px', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div>
              <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '1.6rem', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>{items[0].title}</h2>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: '#333', margin: 0 }}>{items[0].blurb}</p>
            </div>
          </a>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: '2rem', rowGap: '1.5rem' }}>
            {items.slice(1).map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none', color: '#1A1A1A', borderTop: '1px solid #ccc', paddingTop: '0.75rem' }}
              >
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', marginBottom: '0.5rem' }} />
                )}
                <h3 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '1.05rem', margin: '0 0 0.35rem 0', lineHeight: 1.25 }}>{item.title}</h3>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: '#444', margin: 0 }}>{item.blurb}</p>
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  )
}