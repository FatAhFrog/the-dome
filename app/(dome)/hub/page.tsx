import HubCard from '@/components/HubCard'

export default function HubPage() {
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
          Live clock coming in Act 3.
        </HubCard>
        <HubCard title="⛅ Weather">
          Current conditions coming in Act 3.
        </HubCard>
        <HubCard title="📰 Daily News">
          Top headlines coming in Act 3.
        </HubCard>
        <HubCard title="💬 Quick Chat">
          Recent messages coming in Act 3/4.
        </HubCard>
      </div>
    </main>
  )
}