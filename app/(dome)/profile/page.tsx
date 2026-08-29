'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscribeToPush, getPushPermissionState } from '@/lib/push'
import { THEMES, ThemeKey, applyThemeVars, isThemeKey } from '@/lib/themes'
import { useDomeSession } from '@/components/DomeSession'

const CATEGORIES = [
  { value: 'general', label: 'General News' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'warhammer', label: 'Warhammer 40K' },
]

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [newsCategory, setNewsCategory] = useState('general')
  const [newsEnabled, setNewsEnabled] = useState(true)
  const [tetrisCrownEnabled, setTetrisCrownEnabled] = useState(true)
  const [tetrisCrownPiece, setTetrisCrownPiece] = useState('')
  const [metricsModeTetris, setMetricsModeTetris] = useState(false)
  const [nextPreviewSize, setNextPreviewSize] = useState(22)
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('dome')
  const [ownedThemes, setOwnedThemes] = useState<{ key: ThemeKey; name: string }[]>([])
  const [themeSaving, setThemeSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pushStatus, setPushStatus] = useState('default')
  const [pushLoading, setPushLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { user } = useDomeSession()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, news_category, news_enabled, avatar_url, tetris_crown_enabled, tetris_crown_piece, tetris_next_preview_size, active_theme, metrics_mode_tetris')
        .eq('id', user.id)
        .single()

      setUsername(profile?.username || '')
      setNewsCategory(profile?.news_category || 'general')
      setNewsEnabled(profile?.news_enabled ?? true)
      setAvatarUrl(profile?.avatar_url || null)
      setTetrisCrownEnabled(profile?.tetris_crown_enabled ?? true)
      setTetrisCrownPiece(profile?.tetris_crown_piece || '')
      setNextPreviewSize(profile?.tetris_next_preview_size || 22)
      setActiveTheme(isThemeKey(profile?.active_theme) ? profile.active_theme : 'dome')
      setMetricsModeTetris(profile?.metrics_mode_tetris ?? false)

      const { data: purchases } = await supabase.from('theme_purchases').select('theme_key, custom_name').eq('user_id', user.id)
      setOwnedThemes((purchases || []).filter((p) => isThemeKey(p.theme_key)).map((p) => ({ key: p.theme_key as ThemeKey, name: p.custom_name })))
      setLoading(false)
    }

    loadProfile()
  }, [user, supabase])

  const handleThemeChange = async (key: ThemeKey) => {
    setThemeSaving(true)
    setActiveTheme(key)
    applyThemeVars(key)
    if (user) await supabase.from('profiles').upsert({ id: user.id, active_theme: key })
    setThemeSaving(false)
  }

  useEffect(() => {
    getPushPermissionState().then((state) => setPushStatus(state))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username.trim(),
        news_category: newsCategory,
        news_enabled: newsEnabled,
        tetris_crown_enabled: tetrisCrownEnabled,
        tetris_crown_piece: tetrisCrownPiece || null,
        tetris_next_preview_size: nextPreviewSize,
        metrics_mode_tetris: metricsModeTetris,
      })

    setSaving(false)
    setMessage(error ? `Error: ${error.message}` : 'Saved!')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

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
      <h1 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}>Your Profile</h1>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Username</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
          />
        </label>
        
        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Photo</div>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
          ) : (
            <div style={{ width: 80, height: 80, border: '1px solid var(--color-border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>No pic</div>
          )}
          <div style={{ marginTop: '0.5rem' }}>
            <input id="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            <label htmlFor="avatar" style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>{uploading ? 'Uploading...' : 'Change photo'}</label>
          </div>
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            News preference <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>(Experimental)</span>
          </div>
          <select
            value={newsCategory}
            onChange={(e) => setNewsCategory(e.target.value)}
            disabled={!newsEnabled}
            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
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
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Push notifications
          </div>
          {pushStatus === 'denied' ? (
            <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.9rem' }}>
              Blocked — enable notifications for this site in your browser settings.
            </p>
          ) : pushStatus === 'unsupported' ? (
            <p style={{ color: 'var(--color-muted)', margin: 0, fontSize: '0.9rem' }}>Not supported on this browser.</p>
          ) : (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={pushLoading}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {pushLoading ? 'Enabling...' : 'Enable / Refresh notifications'}
            </button>
          )}
        </div>

        <div>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Tetris champion styling
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={tetrisCrownEnabled}
              onChange={(e) => setTetrisCrownEnabled(e.target.checked)}
            />
            <span>Show a badge next to my name in Chat if I&apos;m #1 on the Tetris leaderboard</span>
          </div>
          {tetrisCrownEnabled && (
            <select
              value={tetrisCrownPiece}
              onChange={(e) => setTetrisCrownPiece(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
            >
              <option value="">Default (gold block)</option>
              <option value="I">I-piece (cyan)</option>
              <option value="O">O-piece (yellow)</option>
              <option value="T">T-piece (purple)</option>
              <option value="S">S-piece (green)</option>
              <option value="Z">Z-piece (red)</option>
              <option value="J">J-piece (blue)</option>
              <option value="L">L-piece (orange)</option>
            </select>
          )}
        </div>

        <label>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Tetris &quot;Next Piece&quot; preview size
          </div>
          <select
            value={nextPreviewSize}
            onChange={(e) => setNextPreviewSize(Number(e.target.value))}
            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}
          >
            <option value={16}>Small</option>
            <option value={22}>Medium (default)</option>
            <option value={28}>Large</option>
            <option value={34}>Extra Large</option>
          </select>
        </label>

        <div>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Developer tools</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={metricsModeTetris}
              onChange={(e) => setMetricsModeTetris(e.target.checked)}
            />
            <span>METRICS_MODE_TETRIS — show a live score/lines/moves/speed panel next to the Tetris board</span>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Dome theme</div>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>Buy palettes in the Tetris shop, then pick your favorite here - it re-skins the whole Dome.</p>
          <select value={activeTheme} onChange={(e) => handleThemeChange(e.target.value as ThemeKey)} disabled={themeSaving} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', width: '100%' }}>
            <option value="dome">{THEMES.dome.label} (default)</option>
            {ownedThemes.map(({ key, name }) => <option key={key} value={key}>{name} ({THEMES[key].label})</option>)}
          </select>
          {ownedThemes.length === 0 && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>You do not own any purchased themes yet - earn coins in Tetris and open the shop.</p>}
        </div>

        {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '0.5rem',
            background: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
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
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
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