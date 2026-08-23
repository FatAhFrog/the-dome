import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'var(--color-accent)' }}>The Dome — connection test</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error.message}</p>
      ) : (
        <p style={{ color: 'green' }}>
          ✅ Supabase connected. Session: {data.session ? 'logged in' : 'no active session (expected)'}
        </p>
      )}
    </main>
  )
}