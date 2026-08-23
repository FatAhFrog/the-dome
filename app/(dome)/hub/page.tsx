import HubCard from '@/components/HubCard'
import TimeWidget from '@/components/TimeWidget'
import WeatherWidget from '@/components/WeatherWidget'
import NewsWidget from '@/components/NewsWidget'
import { createClient } from '@/lib/supabase/server'

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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