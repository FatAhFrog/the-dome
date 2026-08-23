'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HubPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: '#EB4600' }}>Welcome to The Dome</h1>
      <p>This is a placeholder — real Hub layout comes in Act 2.</p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#FFAE00',
          color: '#1A1A1A',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Log out
      </button>
    </main>
  )
}