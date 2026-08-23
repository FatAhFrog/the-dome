'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type NewsItem = {
  title: string
  link: string
  thumbnail: string | null
}

const CATEGORIES = [
  { value: 'general', label: 'General News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'warhammer', label: 'Warhammer 40K' },
]

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('general')
  const [newsEnabled, setNewsEnabled] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadDefault = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('news_category')
          .eq('id', user.id)
          .single()
        if (profile?.news_category) setCategory(profile.news_category)
      }
    }
    loadDefault()
  }, [])

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

  useEffect(() => {
    const checkEnabled = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('news_enabled')
        .eq('id', user.id)
        .single()
      setNewsEnabled(profile?.news_enabled ?? true)
    }
    checkEnabled()
  }, [])

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
    
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#EB4600' }}>News</h1>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: '#999' }}>Loading headlines — may take a few seconds...</p>}
      {!loading && items.length === 0 && <p style={{ color: '#999' }}>No headlines available.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              gap: '1rem',
              textDecoration: 'none',
              color: '#1A1A1A',
              border: '1px solid #eee',
              borderRadius: '10px',
              padding: '1rem',
              alignItems: 'center',
            }}
          >
            {item.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnail}
                alt=""
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
              />
            )}
            <p style={{ margin: 0, fontSize: '1rem' }}>{item.title}</p>
          </a>
        ))}
      </div>
    </main>
  )
}