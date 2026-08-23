'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/hub')
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ color: '#EB4600' }}>Sign up for The Dome</h1>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          minLength={6}
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
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <a href="/login" style={{ color: '#FFAE00' }}>Log in</a>
      </p>
    </main>
  )
}