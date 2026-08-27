'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type NewsItem = {
  title: string
  link: string
}

export default function NewsWidget() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      let category = 'general'

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('news_category')
          .eq('id', user.id)
          .single()
        category = profile?.news_category || 'general'
      }

      const res = await fetch(`/api/news?category=${category}`)
      const data = await res.json()
      setItems(data.items || [])
      setLoading(false)
    }

    load()
  }, [])

    if (loading) return <p style={{ color: '#999' }}>Loading headlines — may take a few seconds...</p>
    if (items.length === 0) return <p style={{ color: '#999' }}>No headlines available.</p>

  return (
    <div>
      <div style={{ borderBottom: '2px solid #1A1A1A', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
        <p style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.03em', color: '#1A1A1A' }}>
          DAILY DOME NEWS
        </p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        {items.slice(0, 5).map((item, i) => (
          <li key={i} style={{ borderTop: i > 0 ? '1px solid #eee' : 'none', paddingTop: i > 0 ? '0.4rem' : 0, marginTop: i > 0 ? '0.4rem' : 0 }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1A1A1A', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: '0.85rem', lineHeight: 1.3 }}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
      <Link href="/apps/news" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', color: '#EB4600', textDecoration: 'none', fontWeight: 600 }}>
        Read the full paper →
      </Link>
    </div>
  )
}