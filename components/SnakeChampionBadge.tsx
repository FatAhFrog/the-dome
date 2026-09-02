export default function SnakeChampionBadge({ color }: { color?: string }) {
  return (
    <svg
      aria-label="Reigning Snake champion"
      role="img"
      viewBox="0 0 24 24"
      style={{
        display: 'inline-block',
        width: 18,
        height: 18,
        verticalAlign: 'middle',
      }}
    >
      <title>Reigning Snake champion</title>
      <path d="M5 8c0-2.2 1.8-4 4-4h5.5a3.5 3.5 0 1 1 0 7H10a2 2 0 1 0 0 4h5c2.2 0 4 1.8 4 4" fill="none" stroke={color || 'var(--color-accent-secondary)'} strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="7.5" r="0.8" fill={color || 'var(--color-accent-secondary)'} />
    </svg>
  )
}
