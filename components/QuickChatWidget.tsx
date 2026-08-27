'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LastMessage = {
  content: string
  created_at: string
  profiles: { username: string; avatar_url: string | null } | null
}

export default function QuickChatWidget() {
  const [message, setMessage] = useState<LastMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'general')
        .single()

      if (!room) {
        setLoading(false)
        return
      }

      const { data: msg } = await supabase
        .from('messages')
        .select('content, created_at, profiles(username, avatar_url)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setMessage((msg as unknown as LastMessage) || null)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p style={{ color: '#999', fontSize: '0.9rem' }}>Loading...</p>
  if (!message) return <p style={{ color: '#999', fontSize: '0.9rem' }}>No messages yet...</p>

  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      {message.profiles?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={message.profiles.avatar_url} alt="avatar" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eee', flexShrink: 0 }} />
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{message.profiles?.username || 'Unknown'}</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.content}</p>
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
      </div>
    </div>
  )
}