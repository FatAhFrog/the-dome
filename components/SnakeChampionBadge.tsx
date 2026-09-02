export default function SnakeChampionBadge({ color }: { color?: string }) {
  const cellPx = 6
  const shape = [[1, 0], [2, 0], [0, 1], [1, 1]]

  return (
    <span
      title="Reigning Snake champion"
      aria-label="Reigning Snake champion"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 3 * cellPx,
        height: 2 * cellPx,
        verticalAlign: 'middle',
      }}
    >
      {shape.map(([x, y], index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            left: x * cellPx,
            top: y * cellPx,
            width: cellPx - 1,
            height: cellPx - 1,
            background: color || 'var(--color-accent-secondary)',
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  )
}
