'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

type Point = { x: number; y: number }

const randomFood = (snake: Point[]): Point => {
  let food: Point
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (snake.some((s) => s.x === food.x && s.y === food.y))
  return food
}

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Point>({ x: 15, y: 10 })
  const directionRef = useRef<Point>({ x: 1, y: 0 })
  const lastAppliedDirection = useRef<Point>({ x: 1, y: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const supabase = createClient()
  const submittedRef = useRef(false)

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(randomFood(initialSnake))
    directionRef.current = { x: 1, y: 0 }
    lastAppliedDirection.current = { x: 1, y: 0 }
    setScore(0)
    setGameOver(false)
    setPaused(false)
    submittedRef.current = false
    setStarted(true)
  }

  const submitScore = useCallback(async (finalScore: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || finalScore <= 0) return
    // Keeps `scores` pruned to the top 10 rows per game — see
    // supabase/migrations/005_top_scores_rpc.sql.
    const { error } = await supabase.rpc('submit_game_score', { p_game: 'snake', p_score: finalScore })
    if (error) console.error('[snake] failed to submit score:', error.message, error)
  }, [supabase])

  useEffect(() => {
    if (gameOver && !submittedRef.current) {
      submittedRef.current = true
      submitScore(score)
    }
  }, [gameOver, score, submitScore])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (started && !gameOver) setPaused((currentPaused) => !currentPaused)
        return
      }
      if (paused) return
      const dir = lastAppliedDirection.current
      if (e.key === 'ArrowUp' && dir.y === 0) directionRef.current = { x: 0, y: -1 }
      else if (e.key === 'ArrowDown' && dir.y === 0) directionRef.current = { x: 0, y: 1 }
      else if (e.key === 'ArrowLeft' && dir.x === 0) directionRef.current = { x: -1, y: 0 }
      else if (e.key === 'ArrowRight' && dir.x === 0) directionRef.current = { x: 1, y: 0 }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameOver, paused])

  useEffect(() => {
    if (!started || gameOver || paused) return

    const interval = setInterval(() => {
      const moveDirection = directionRef.current
      lastAppliedDirection.current = moveDirection

      setSnake((prevSnake) => {
        const head = prevSnake[0]
        const newHead = { x: head.x + moveDirection.x, y: head.y + moveDirection.y }

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE ||
          prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)
        ) {
          setGameOver(true)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 1)
          setFood(randomFood(newSnake))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, 120)

    return () => clearInterval(interval)
  }, [started, gameOver, paused, food])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.fillStyle = '#FFAE00'
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#EB4600' : '#1A1A1A'
      ctx.fillRect(s.x * CELL_SIZE, s.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
    })
  }, [snake, food])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#EB4600', marginBottom: '1rem' }}>Snake</h1>
      <p style={{ marginBottom: '1rem' }}>Score: {score}</p>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
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
              background: 'rgba(255,255,255,0.9)',
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

      <p style={{ marginTop: '1rem', color: '#999', fontSize: '0.9rem' }}>Use arrow keys to move · P pause</p>
    </main>
  )
}