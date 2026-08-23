'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToPush, getPushPermissionState } from '@/lib/push'

const CATEGORIES = [
  { value: 'general', label: 'General News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'warhammer', label: 'Warhammer 40K' },
]

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [newsCategory, setNewsCategory] = useState('general')
  const [newsEnabled, setNewsEnabled] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pushStatus, setPushStatus] = useState('default')
  const [pushLoading, setPushLoading] = useState(false)
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
        .select('username, news_category, news_enabled, avatar_url')
        .eq('id', user.id)
        .single()

      setUsername(profile?.username || '')
      setNewsCategory(profile?.news_category || 'general')
      setNewsEnabled(profile?.news_enabled ?? true)
      setAvatarUrl(profile?.avatar_url || null)
      setLoading(false)
    }

    loadProfile()
  }, [])

  useEffect(() => {
    getPushPermissionState().then((state) => setPushStatus(state))
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage(`Error: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl })

    setUploading(false)

    if (updateError) {
      setMessage(`Error: ${updateError.message}`)
    } else {
      setAvatarUrl(publicUrl)
      setMessage('Avatar updated!')
    }
  }

  const handleEnableNotifications = async () => {
    setPushLoading(true)
    const success = await subscribeToPush()
    setPushLoading(false)
    if (success) {
      setPushStatus('granted')
      setMessage('Notifications enabled!')
    } else {
      setMessage('Could not enable notifications — check your browser permissions.')
    }
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
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: '#666' }}>Photo</div>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            <div style={{ width: 80, height: 80, border: '1px solid #eee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No pic</div>
          )}
          <div style={{ marginTop: '0.5rem' }}>
            <input id="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            <label htmlFor="avatar" style={{ cursor: 'pointer', color: '#EB4600' }}>{uploading ? 'Uploading...' : 'Change photo'}</label>
          </div>
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
        <div>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: '#666' }}>Push notifications</div>

          {pushStatus === 'granted' ? (
            <div>✅ Enabled on this device</div>

          ) : pushStatus === 'denied' ? (
            <div style={{ color: '#999' }}>Blocked — enable notifications for this site in your browser settings.</div>

          ) : pushStatus === 'unsupported' ? (
            <div>Not supported on this browser.</div>

          ) : (
            <button
              type="button"
              onClick={handleEnableNotifications}
              style={{ padding: '0.5rem', background: '#EB4600', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {pushLoading ? 'Enabling...' : 'Enable notifications'}
            </button>
          )}
        </div>

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