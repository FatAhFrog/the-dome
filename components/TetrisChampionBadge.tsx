const ICON_SHAPES: Record<string, number[][]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
}

export default function TetrisChampionBadge({ piece }: { piece: string | null }) {
  const cellPx = 6
  const shape = piece ? ICON_SHAPES[piece] : [[0, 0], [1, 0], [0, 1], [1, 1]]
  const gridWidth = Math.max(...shape.map(([x]) => x)) + 1
  const color = piece ? `var(--piece-${piece.toLowerCase()})` : 'var(--piece-o)'

  return (
    <span
      title="Reigning Tetris champion"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: gridWidth * cellPx,
        height: 2 * cellPx,
        verticalAlign: 'middle',
      }}
    >
      {shape.map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: x * cellPx,
            top: y * cellPx,
            width: cellPx - 1,
            height: cellPx - 1,
            background: color,
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  )
}
