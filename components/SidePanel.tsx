'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDomeSession } from '@/components/DomeSession'

const navItems = [
  { label: 'Hub', href: '/hub' },
  { label: 'Chat', href: '/apps/chat' },
  { label: 'News', href: '/apps/news' },
  { label: 'Weather', href: '/apps/weather' },
  { label: 'Snake', href: '/apps/snake' },
  { label: 'Tetris', href: '/apps/tetris' },
  { label: 'Dinosaur Game', href: '/apps/dinosaur' },
  { label: 'Minesweeper', href: '/apps/minesweeper' },
  { label: 'Leaderboard', href: '/apps/leaderboard' },
  { label: 'Races', href: '/apps/races' },
]

export default function SidePanel() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useDomeSession()
  const [supabase] = useState(() => createClient())

  const newsEnabled = profile?.news_enabled ?? true
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const currentUserId = useRef<string | null>(user?.id ?? null)
  const pathnameRef = useRef(pathname)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    currentUserId.current = user?.id ?? null
    pathnameRef.current = pathname
  }, [user?.id, pathname])

  useEffect(() => {
    const init = async () => {
      if (!user) return

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
  }, [user, supabase])

  if (pathname === '/apps/chat' && unreadCount > 0) {
    setUnreadCount(0)
  }

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
                    color: isActive ? 'var(--color-on-accent)' : 'var(--color-panel-text)',
                    background: isActive ? 'var(--color-accent)' : 'transparent',
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
                        background: isActive ? 'var(--color-on-accent)' : 'var(--color-accent)',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-on-accent)',
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
            color: pathname === '/profile' ? 'var(--color-on-accent)' : 'var(--color-panel-text)',
            background: pathname === '/profile' ? 'var(--color-accent)' : 'transparent',
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
            background: 'var(--color-panel-background)',
            color: 'var(--color-panel-text)',
            border: '1px solid var(--color-border)',
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