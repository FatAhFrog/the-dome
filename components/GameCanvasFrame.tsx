import type { CSSProperties, ReactNode } from 'react'

/**
 * Frame a game canvas without clipping it.
 * Firefox composites `overflow: hidden` + `border-radius` around a <canvas>
 * as a solid black rectangle; the 2D bitmap still draws (NEXT/HOLD keep working).
 */
export default function GameCanvasFrame({
  children,
  borderColor = 'var(--color-panel-text)',
}: {
  children: ReactNode
  borderColor?: string
}) {
  const frame: CSSProperties = {
    position: 'absolute',
    inset: 0,
    border: `2px solid ${borderColor}`,
    borderRadius: 8,
    pointerEvents: 'none',
  }

  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      {children}
      <div aria-hidden style={frame} />
    </div>
  )
}
