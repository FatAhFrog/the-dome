'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="side-panel">
      <div className="side-panel-brand">The Dome</div>
      <div className="side-panel-links">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="side-panel-link"
              style={{
                color: isActive ? '#FFFFFF' : '#1A1A1A',
                background: isActive ? '#EB4600' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="side-panel-account" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
        <Link
          href="/profile"
          className="side-panel-link"
          style={{
            color: pathname === '/profile' ? '#FFFFFF' : '#1A1A1A',
            background: pathname === '/profile' ? '#EB4600' : 'transparent',
            fontWeight: pathname === '/profile' ? 600 : 400,
          }}
        >
          Profile
        </Link>
      </div>
      <button onClick={handleLogout} className="side-panel-logout">
        Log out
      </button>
    </nav>
  )
}