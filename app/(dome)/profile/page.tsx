'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'general', label: 'General News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'warhammer', label: 'Warhammer 40K' },
]

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [newsCategory, setNewsCategory] = useState('general')
  const [newsEnabled, setNewsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, news_category, news_enabled')
        .eq('id', user.id)
        .single()

      setUsername(profile?.username || '')
      setNewsCategory(profile?.news_category || 'general')
      setNewsEnabled(profile?.news_enabled ?? true)
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: username.trim(), news_category: newsCategory, news_enabled: newsEnabled })

    setSaving(false)
    setMessage(error ? `Error: ${error.message}` : 'Saved!')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <main style={{ padding: '2rem' }}>Loading...</main>

  return (
    <main style={{ padding: '2rem', maxWidth: '400px' }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1.5rem' }}>Your Profile</h1>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: '#666' }}>Username</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }}
          />
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: '#666' }}>
            News preference <span style={{ fontSize: '0.8rem', color: '#999' }}>(Experimental)</span>
          </div>
          <select
            value={newsCategory}
            onChange={(e) => setNewsCategory(e.target.value)}
            disabled={!newsEnabled}
            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              checked={newsEnabled}
              onChange={(e) => setNewsEnabled(e.target.checked)}
            />
            <span>Show News on Hub and side panel</span>
          </div>
        </label>
        {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '0.5rem',
            background: '#EB4600',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: '0.5rem',
            background: 'transparent',
            color: '#EB4600',
            border: '1px solid #EB4600',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Log out
        </button>
      </form>
    </main>
  )
}