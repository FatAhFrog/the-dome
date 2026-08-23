'use client'

import { useState, useEffect } from 'react'
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
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <li key={i}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1A1A1A', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  )
}