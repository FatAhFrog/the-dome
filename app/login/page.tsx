'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('banned') === '1'
      ? 'This account has been permanently banned.'
      : null
  ))
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    if (authData?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', authData.user.id)
        .single()

      if (profile?.is_banned) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('This account has been permanently banned.')
        return
      }
    }

    setLoading(false)

    router.push('/hub')
    router.refresh()
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: '#EB4600' }}>Log in to The Dome</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.5rem',
            background: '#EB4600',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don&apos;t have an account? <a href="/signup" style={{ color: '#FFAE00' }}>Sign up</a>
      </p>
    </main>
  )
}