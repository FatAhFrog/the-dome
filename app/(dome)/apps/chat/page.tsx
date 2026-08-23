 'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string; avatar_url: string | null } | null
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const messagesEndRef = useRef(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadRoom = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'general')
        .single()

      if (!room) return

      setRoomId(room.id)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
      setLoading(false)

      if (channelRef.current) return

      const channel = supabase
        .channel(`room:${room.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${room.id}`,
          },
          async (payload) => {
            const newMsg = payload.new as Message
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.user_id)
              .single()
            setMessages((current) => [
              ...current,
              { ...newMsg, profiles: profile },
            ])
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    loadRoom()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !roomId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: user.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
    }
  }

  if (loading) return <main style={{ padding: '2rem' }}>Loading chat...</main>

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1rem' }}>Chat — #general</h1>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          border: '1px solid #eee',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        {messages.length === 0 && <p style={{ color: '#999' }}>No messages yet — say something!</p>}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {msg.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={msg.profiles.avatar_url} alt="avatar" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee' }} />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, marginBottom: '0.25rem' }}>{msg.profiles?.username || 'Unknown'}</p>
              <p style={{ margin: 0 }}>{msg.content}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>{new Date(msg.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1.5rem',
            background: '#EB4600',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </main>
  )
}