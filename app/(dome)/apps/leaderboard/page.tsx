import { createClient } from '@/lib/supabase/server'

type ScoreRow = {
  score: number
  created_at: string
  profiles: { username: string | null } | null
}

async function getTopScores(supabase: Awaited<ReturnType<typeof createClient>>, game: 'snake' | 'tetris') {
  const { data } = await supabase
    .from('scores')
    .select('score, created_at, profiles(username)')
    .eq('game', game)
    .order('score', { ascending: false })
    .limit(10)
  return (data as unknown as ScoreRow[]) || []
}

function LeaderboardList({ title, rows }: { title: string; rows: ScoreRow[] }) {
  return (
    <div style={{ flex: 1, minWidth: '260px' }}>
      <h2 style={{ fontSize: '1.1rem', color: '#1A1A1A', marginBottom: '0.75rem' }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ color: '#999' }}>No scores yet — go set one!</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {rows.map((row, i) => (
            <li key={i} style={{ color: '#1A1A1A' }}>
              <strong>{row.profiles?.username || 'Someone'}</strong>{' '}
              <span style={{ color: '#666' }}>— {row.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const [snakeScores, tetrisScores] = await Promise.all([
    getTopScores(supabase, 'snake'),
    getTopScores(supabase, 'tetris'),
  ])

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1.5rem' }}>Leaderboard</h1>
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        <LeaderboardList title="🐍 Snake — Top 10" rows={snakeScores} />
        <LeaderboardList title="🧱 Tetris — Top 10" rows={tetrisScores} />
      </div>
    </main>
  )
}
