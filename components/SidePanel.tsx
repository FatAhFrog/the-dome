'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Hub', href: '/hub' },
  { label: 'Chat', href: '/apps/chat' },
  { label: 'News', href: '/apps/news' },
  { label: 'Weather', href: '/apps/weather' },
  { label: 'Snake', href: '/apps/snake' },
  { label: 'Tetris', href: '/apps/tetris' },
  { label: 'Races', href: '/apps/races' },
]

export default function SidePanel() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [newsEnabled, setNewsEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const currentUserId = useRef<string | null>(null)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      currentUserId.current = user.id

      const { data: profile } = await supabase
        .from('profiles')
        .select('news_enabled')
        .eq('id', user.id)
        .single()
      setNewsEnabled(profile?.news_enabled ?? true)

      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'general')
        .single()
      if (!room) return

      if (channelRef.current) return

      const channel = supabase
        .channel('global-chat-watch')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${room.id}`,
          },
          async (payload) => {
            const msg = payload.new as { user_id: string; content: string }

            // Don't notify yourself about your own messages
            if (msg.user_id === currentUserId.current) return

            // Don't notify if you're already looking at Chat
            if (pathnameRef.current === '/apps/chat') return

            setUnreadCount((c) => c + 1)

            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', msg.user_id)
              .single()

            const name = senderProfile?.username || 'Someone'
            setToast(`${name}: ${msg.content}`)
            setTimeout(() => setToast(null), 3500)
          }
        )
        .subscribe()
      channelRef.current = channel
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // Clear unread count whenever the user navigates into Chat
  useEffect(() => {
    if (pathname === '/apps/chat') {
      setUnreadCount(0)
    }
  }, [pathname])

  return (
    <>
      <nav className="side-panel">
        <div className="side-panel-brand">The Dome</div>
        <div className="side-panel-links">
          {navItems
            .filter((item) => newsEnabled || item.href !== '/apps/news')
            .map((item) => {
              const isActive = pathname === item.href
              const showBadge = item.href === '/apps/chat' && unreadCount > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="side-panel-link"
                  style={{
                    color: isActive ? '#FFFFFF' : '#1A1A1A',
                    background: isActive ? '#EB4600' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.label}</span>
                  {showBadge && (
                    <span
                      style={{
                        background: isActive ? '#FFFFFF' : '#EB4600',
                        color: isActive ? '#EB4600' : '#FFFFFF',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        minWidth: '1.2rem',
                        textAlign: 'center',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
        </div>
        <Link
          href="/profile"
          className="side-panel-link"
          style={{
            color: pathname === '/profile' ? '#FFFFFF' : '#1A1A1A',
            background: pathname === '/profile' ? '#EB4600' : 'transparent',
            fontWeight: pathname === '/profile' ? 600 : 400,
            marginTop: 'auto',
          }}
        >
          Profile
        </Link>
      </nav>

      {toast && (
        <div
          onClick={() => router.push('/apps/chat')}
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            background: '#1A1A1A',
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            fontSize: '0.9rem',
            maxWidth: '300px',
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          💬 {toast}
        </div>
      )}
    </>
  )
}