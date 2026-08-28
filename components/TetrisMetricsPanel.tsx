'use client'

import { useMemo, useState } from 'react'

// One sample per second while a game is running. score/lines/moves are
// PER-SECOND deltas (not running totals) — how much each changed since the
// previous sample. speed is the current gravity rate in drops/minute
// (60000 / dropIntervalMs), so it reads as "higher = faster" like the other
// three instead of an inverted millisecond countdown.
export type TetrisMetricSample = {
  t: number
  score: number
  lines: number
  moves: number
  speed: number
}

const WINDOWS: { key: string; label: string; seconds: number }[] = [
  { key: '1m', label: '1 min', seconds: 60 },
  { key: '10m', label: '10 min', seconds: 600 },
  { key: '1h', label: '1 hr', seconds: 3600 },
  { key: '2h', label: '2 hr', seconds: 7200 },
]

const CHART_W = 420
const CHART_H = 84
const PAD_L = 34
const PAD_B = 16

function MetricChart({
  title,
  unit,
  data,
  accessor,
  color,
}: {
  title: string
  unit: string
  data: TetrisMetricSample[]
  accessor: (s: TetrisMetricSample) => number
  color: string
}) {
  const points = data.map((s) => ({ t: s.t, v: accessor(s) }))
  const maxV = Math.max(1, ...points.map((p) => p.v))
  const minT = points.length ? points[0].t : 0
  const maxT = points.length ? points[points.length - 1].t : 1
  const spanT = Math.max(1, maxT - minT)

  const plotW = CHART_W - PAD_L - 8
  const plotH = CHART_H - PAD_B - 8

  const path = points
    .map((p, i) => {
      const x = PAD_L + ((p.t - minT) / spanT) * plotW
      const y = 8 + plotH - (p.v / maxV) * plotH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const latest = points.length ? points[points.length - 1].v : 0

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-panel-text)', opacity: 0.75 }}>{title}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-panel-text)', opacity: 0.6 }}>
          {latest.toFixed(unit === 'drops/min' ? 0 : 1)} {unit}
        </span>
      </div>
      <svg width={CHART_W} height={CHART_H} style={{ display: 'block', overflow: 'visible' }}>
        {/* baseline + max gridline */}
        <line x1={PAD_L} y1={8 + plotH} x2={CHART_W - 4} y2={8 + plotH} stroke="var(--color-border)" strokeWidth={1} />
        <line x1={PAD_L} y1={8} x2={CHART_W - 4} y2={8} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2,3" />
        <text x={0} y={12} fontSize={9} fill="var(--color-panel-text)" opacity={0.5}>{maxV.toFixed(0)}</text>
        <text x={0} y={8 + plotH + 3} fontSize={9} fill="var(--color-panel-text)" opacity={0.5}>0</text>
        {points.length > 1 ? (
          <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          <text x={PAD_L + 6} y={CHART_H / 2} fontSize={10} fill="var(--color-panel-text)" opacity={0.45}>
            Collecting data…
          </text>
        )}
      </svg>
    </div>
  )
}

export default function TetrisMetricsPanel({ samples }: { samples: TetrisMetricSample[] }) {
  const [windowKey, setWindowKey] = useState('1m')

  const windowed = useMemo(() => {
    if (samples.length === 0) return []
    const seconds = WINDOWS.find((w) => w.key === windowKey)?.seconds ?? 60
    const latestT = samples[samples.length - 1].t
    return samples.filter((s) => s.t >= latestT - seconds)
  }, [samples, windowKey])

  return (
    <div
      style={{
        width: CHART_W + 24,
        border: `2px solid var(--color-panel-text)`,
        borderRadius: '8px',
        padding: '14px',
        background: 'var(--color-panel-background)',
        color: 'var(--color-panel-text)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, opacity: 0.75 }}>METRICS</p>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                background: windowKey === w.key ? 'var(--color-accent)' : 'transparent',
                color: windowKey === w.key ? 'var(--color-on-accent, #fff)' : 'var(--color-panel-text)',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <MetricChart title="Score / sec" unit="pts/s" data={windowed} accessor={(s) => s.score} color="var(--color-accent)" />
      <MetricChart title="Lines / sec" unit="/s" data={windowed} accessor={(s) => s.lines} color="var(--color-accent-secondary)" />
      <MetricChart title="Moves / sec" unit="/s" data={windowed} accessor={(s) => s.moves} color="var(--piece-t)" />
      <MetricChart title="Game speed since start" unit="drops/min" data={windowed} accessor={(s) => s.speed} color="var(--piece-z)" />

      {samples.length === 0 && (
        <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem', marginBottom: 0 }}>
          Starts recording once a game begins.
        </p>
      )}
    </div>
  )
}
