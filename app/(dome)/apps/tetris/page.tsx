'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const COLS = 10
const ROWS = 20
const CELL = 24

type Cell = string | null
type Board = Cell[][]

const COLORS: Record<string, string> = {
  I: '#00c2c2',
  O: '#FFAE00',
  T: '#a259ff',
  S: '#3ddc84',
  Z: '#EB4600',
  J: '#3b82f6',
  L: '#ff7a1a',
}

const SHAPES: Record<string, number[][][]> = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]],
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]],
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]],
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]],
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]],
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]],
  ],
}

const PIECE_TYPES = Object.keys(SHAPES)

const randomPiece = () => PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]

const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

type ActivePiece = {
  type: string
  rotation: number
  x: number
  y: number
}

export default function TetrisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [active, setActive] = useState<ActivePiece | null>(null)
  const [nextType, setNextType] = useState<string>('I')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const supabase = createClient()
  const submittedRef = useRef(false)

  const boardRef = useRef(board)
  const activeRef = useRef(active)
  boardRef.current = board
  activeRef.current = active

  useEffect(() => {
    setNextType(randomPiece())
  }, [])

  const getCells = (piece: ActivePiece) =>
    SHAPES[piece.type][piece.rotation].map(([dx, dy]) => [piece.x + dx, piece.y + dy])

  const isValidPosition = (piece: ActivePiece, testBoard: Board) => {
    const cells = getCells(piece)
    return cells.every(([x, y]) => {
      if (x < 0 || x >= COLS || y >= ROWS) return false
      if (y < 0) return true
      return !testBoard[y][x]
    })
  }

  const spawnPiece = useCallback((type: string): ActivePiece => {
    return { type, rotation: 0, x: 3, y: -2 }
  }, [])

  const lockPiece = useCallback((piece: ActivePiece, currentBoard: Board) => {
    const newBoard = currentBoard.map((row) => [...row])
    getCells(piece).forEach(([x, y]) => {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        newBoard[y][x] = COLORS[piece.type]
      }
    })
    const lockedAboveBoard = getCells(piece).some(([, y]) => y < 0)
    if (lockedAboveBoard) {
      setGameOver(true)
      setActive(null)
      return
    }

    let clearedLines = 0
    const filteredBoard = newBoard.filter((row) => {
      const full = row.every((cell) => cell !== null)
      if (full) clearedLines++
      return !full
    })
    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill(null))
    }

    if (clearedLines > 0) {
      setScore((s) => s + [0, 100, 300, 500, 800][clearedLines] * level)
      setLines((l) => {
        const newLines = l + clearedLines
        setLevel(1 + Math.floor(newLines / 10))
        return newLines
      })
    }

    setBoard(filteredBoard)

    const newType = nextType
    const upcoming = randomPiece()
    setNextType(upcoming)
    const spawned = spawnPiece(newType)

    if (!isValidPosition(spawned, filteredBoard)) {
      setGameOver(true)
      setActive(null)
    } else {
      setActive(spawned)
    }
  }, [nextType, spawnPiece, level])

  const resetGame = () => {
    const fresh = emptyBoard()
    setBoard(fresh)
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    submittedRef.current = false
    setPaused(false)
    const firstType = randomPiece()
    const secondType = randomPiece()
    setNextType(secondType)
    setActive(spawnPiece(firstType))
    setStarted(true)
  }

  const submitScore = useCallback(async (finalScore: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('scores').insert({ user_id: user.id, game: 'tetris', score: finalScore })
  }, [supabase])

  useEffect(() => {
    if (gameOver && !submittedRef.current) {
      submittedRef.current = true
      submitScore(score)
    }
  }, [gameOver, score, submitScore])

  const tryMove = useCallback((dx: number, dy: number) => {
    const piece = activeRef.current
    if (!piece) return false
    const moved = { ...piece, x: piece.x + dx, y: piece.y + dy }
    if (isValidPosition(moved, boardRef.current)) {
      setActive(moved)
      return true
    }
    return false
  }, [])

  const tryRotate = useCallback(() => {
    const piece = activeRef.current
    if (!piece) return
    const nextRotation = (piece.rotation + 1) % 4
    const rotated = { ...piece, rotation: nextRotation }
    if (isValidPosition(rotated, boardRef.current)) {
      setActive(rotated)
      return
    }
    for (const kick of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, x: rotated.x + kick }
      if (isValidPosition(kicked, boardRef.current)) {
        setActive(kicked)
        return
      }
    }
  }, [])

  const hardDrop = useCallback(() => {
    const piece = activeRef.current
    if (!piece) return
    let dropped = piece
    while (isValidPosition({ ...dropped, y: dropped.y + 1 }, boardRef.current)) {
      dropped = { ...dropped, y: dropped.y + 1 }
    }
    setActive(dropped)
    lockPiece(dropped, boardRef.current)
  }, [lockPiece])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || gameOver) return
      if (e.key === 'p' || e.key === 'P') { setPaused((p) => !p); return }
      if (paused) return
      if (e.key === 'ArrowLeft') tryMove(-1, 0)
      else if (e.key === 'ArrowRight') tryMove(1, 0)
      else if (e.key === 'ArrowDown') tryMove(0, 1)
      else if (e.key === 'ArrowUp') tryRotate()
      else if (e.key === ' ') { e.preventDefault(); hardDrop() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameOver, paused, tryMove, tryRotate, hardDrop])

  useEffect(() => {
    if (!started || gameOver || paused) return
    const speed = Math.max(150, 800 - (level - 1) * 60)
    const interval = setInterval(() => {
      const piece = activeRef.current
      if (!piece) return
      const moved = { ...piece, y: piece.y + 1 }
      if (isValidPosition(moved, boardRef.current)) {
        setActive(moved)
      } else {
        lockPiece(piece, boardRef.current)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [started, gameOver, paused, level, lockPiece])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillStyle = cell
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
        }
      })
    })

    if (active) {
      ctx.fillStyle = COLORS[active.type]
      getCells(active).forEach(([x, y]) => {
        if (y >= 0) {
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
        }
      })
    }

    ctx.strokeStyle = '#eee'
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL, 0)
      ctx.lineTo(x * CELL, ROWS * CELL)
      ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL)
      ctx.lineTo(COLS * CELL, y * CELL)
      ctx.stroke()
    }
  }, [board, active])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1rem' }}>Tetris</h1>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <p>Score: {score}</p>
        <p>Lines: {lines}</p>
        <p>Level: {level}</p>
        <p>Next: {nextType}</p>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          style={{ border: '2px solid #1A1A1A', borderRadius: '8px' }}
        />
        {started && !gameOver && !paused && (
          <button
            onClick={() => setPaused(true)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '0.25rem 0.75rem',
              background: '#1A1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Pause
          </button>
        )}
        {(!started || gameOver || paused) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.92)',
              borderRadius: '8px',
            }}
          >
            {paused && !gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Paused</p>}
            {gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Game Over! Score: {score}</p>}
            <button
              onClick={paused ? () => setPaused(false) : resetGame}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#EB4600',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {paused ? 'Resume' : gameOver ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: '1rem', color: '#999', fontSize: '0.9rem' }}>
        ← → move · ↓ soft drop · ↑ rotate · Space hard drop · P pause
      </p>
    </main>
  )
}