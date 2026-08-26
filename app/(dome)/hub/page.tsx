import HubCard from '@/components/HubCard'
import TimeWidget from '@/components/TimeWidget'
import WeatherWidget from '@/components/WeatherWidget'
import NewsWidget from '@/components/NewsWidget'
import { createClient } from '@/lib/supabase/server'

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  let newsEnabled = true
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('news_enabled')
      .eq('id', user.id)
      .single()
    newsEnabled = profile?.news_enabled ?? true
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1.5rem' }}>Welcome to The Dome</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {announcements && announcements.length > 0 && (
          <HubCard title="📢 Developer Announcements">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {announcements.map((a, i) => (
                <div key={i}>
                  <p style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '0.15rem' }}>{a.title}</p>
                  <p style={{ fontSize: '0.85rem' }}>{a.body}</p>
                </div>
              ))}
            </div>
          </HubCard>
        )}
        <HubCard title="🕐 Time">
          <TimeWidget />
        </HubCard>
        <HubCard title="⛅ Weather">
          <WeatherWidget />
        </HubCard>
        {newsEnabled && (
          <HubCard title="📰 Daily News">
            <NewsWidget />
          </HubCard>
        )}
        <HubCard title="💬 Quick Chat">
          Recent messages coming soon.
        </HubCard>
      </div>
    </main>
  )
}