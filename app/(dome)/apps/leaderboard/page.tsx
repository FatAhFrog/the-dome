import { createClient } from '@/lib/supabase/server'

type ScoreRow = {
  score: number
  created_at: string
  username: string | null
}

type GameKey = 'snake' | 'tetris' | 'dino' | 'minesweeper'

async function getTopScores(supabase: Awaited<ReturnType<typeof createClient>>, game: GameKey) {
  const { data } = await supabase.rpc('get_top_scores', { p_game: game })
  return (data as unknown as ScoreRow[]) || []
}

// Rank rows cycle through the 7 theme-driven tetromino colors, then mix each
// toward panel text so pale/dark pieces remain readable on every panel.
const RETRO_COLOR_VARS = ['--piece-i', '--piece-o', '--piece-t', '--piece-s', '--piece-z', '--piece-j', '--piece-l']

const ordinal = (n: number) => {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}TH`
  switch (n % 10) {
    case 1: return `${n}ST`
    case 2: return `${n}ND`
    case 3: return `${n}RD`
    default: return `${n}TH`
  }
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

function ArcadePanel({ title, game, rows }: { title: string; game: GameKey; rows: ScoreRow[] }) {
  return (
    <div style={{ background: 'var(--color-panel-background)', border: '4px solid var(--color-accent)', borderRadius: '4px', padding: '1.5rem', fontFamily: '"Press Start 2P", monospace', color: 'var(--color-panel-text)', flex: 1, minWidth: '320px' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--color-accent)', fontSize: '1rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>{title}</h2>
      {rows.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-panel-text)', opacity: 0.5, fontSize: '0.65rem' }}>NO SCORES YET</p>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 4rem', fontSize: '0.6rem', color: 'var(--color-panel-text)', opacity: 0.6, marginBottom: '1rem' }}>
            <span>RANK</span><span>NAME</span><span style={{ textAlign: 'right' }}>SCORE</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 4rem', fontSize: '0.65rem', color: `color-mix(in srgb, var(${RETRO_COLOR_VARS[i % RETRO_COLOR_VARS.length]}) 68%, var(--color-panel-text))`, marginBottom: '0.9rem', lineHeight: 1.4 }}>
              <span>{ordinal(i + 1)}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>{(row.username || 'UNKNOWN').toUpperCase()}</span>
              <span style={{ textAlign: 'right' }}>{game === 'minesweeper' ? formatTime(row.score) : row.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const [snakeScores, tetrisScores, dinoScores, minesweeperScores] = await Promise.all([
    getTopScores(supabase, 'snake'),
    getTopScores(supabase, 'tetris'),
    getTopScores(supabase, 'dino'),
    getTopScores(supabase, 'minesweeper'),
  ])

  return (
    <main style={{ padding: '2rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>
      <h1 style={{ color: 'var(--color-accent)', marginBottom: '1.5rem', fontFamily: '"Press Start 2P", monospace', fontSize: '1.3rem' }}>LEADERBOARD</h1>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <ArcadePanel title="SNAKE" game="snake" rows={snakeScores} />
        <ArcadePanel title="TETRIS" game="tetris" rows={tetrisScores} />
        <ArcadePanel title="DINO" game="dino" rows={dinoScores} />
        <ArcadePanel title="MINESWEEPER" game="minesweeper" rows={minesweeperScores} />
      </div>
    </main>
  )
}
