'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDomeSession } from '@/components/DomeSession'
import { readCssVar, THEME_CHANGE_EVENT } from '@/lib/themes'

const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
/** Snap period — one integer cell per beat. Not a lerp / dt tween. */
const STEP_MS = 120
const GUARD_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'p', 'P'])

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
  const { user } = useDomeSession()
  const supabase = createClient()

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const foodRef = useRef<Point>({ x: 15, y: 10 })
  const directionRef = useRef<Point>({ x: 1, y: 0 })
  const lastAppliedDirection = useRef<Point>({ x: 1, y: 0 })
  const dirtyRef = useRef(true)
  const stepAccumRef = useRef(0)
  const lastFrameRef = useRef(0)
  const rafRef = useRef(0)

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const submittedRef = useRef(false)

  const startedRef = useRef(started)
  const gameOverRef = useRef(gameOver)
  const pausedRef = useRef(paused)

  useEffect(() => {
    startedRef.current = started
    gameOverRef.current = gameOver
    pausedRef.current = paused
  }, [started, gameOver, paused])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    ctx.fillStyle = readCssVar('--color-panel-background', '#fafafa')
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const food = foodRef.current
    ctx.fillStyle = readCssVar('--color-accent-secondary', '#FFAE00')
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)

    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? readCssVar('--color-accent', '#EB4600') : readCssVar('--color-text', '#1A1A1A')
      ctx.fillRect(s.x * CELL_SIZE, s.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
    })
    return true
  }, [])

  const step = useCallback(() => {
    const moveDirection = directionRef.current
    lastAppliedDirection.current = moveDirection
    const prevSnake = snakeRef.current
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
      return
    }

    const newSnake = [newHead, ...prevSnake]
    const food = foodRef.current

    if (newHead.x === food.x && newHead.y === food.y) {
      setScore((s) => s + 1)
      foodRef.current = randomFood(newSnake)
    } else {
      newSnake.pop()
    }

    snakeRef.current = newSnake
    dirtyRef.current = true
  }, [])

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }]
    snakeRef.current = initialSnake
    foodRef.current = randomFood(initialSnake)
    directionRef.current = { x: 1, y: 0 }
    lastAppliedDirection.current = { x: 1, y: 0 }
    stepAccumRef.current = 0
    lastFrameRef.current = 0
    dirtyRef.current = true
    setScore(0)
    setGameOver(false)
    setPaused(false)
    submittedRef.current = false
    setStarted(true)
  }

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || finalScore <= 0) return
    const { error } = await supabase.rpc('submit_game_score', { p_game: 'snake', p_score: finalScore })
    if (error) console.error('[snake] failed to submit score:', error.message, error)
  }, [supabase, user])

  useEffect(() => {
    if (gameOver && !submittedRef.current) {
      submittedRef.current = true
      submitScore(score)
    }
  }, [gameOver, score, submitScore])

  useEffect(() => {
    const onTheme = () => {
      dirtyRef.current = true
    }
    window.addEventListener(THEME_CHANGE_EVENT, onTheme)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onTheme)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (GUARD_KEYS.has(e.key)) e.preventDefault()
      if (e.key === 'p' || e.key === 'P') {
        if (startedRef.current && !gameOverRef.current) setPaused((currentPaused) => !currentPaused)
        return
      }
      if (pausedRef.current) return
      const dir = lastAppliedDirection.current
      if (e.key === 'ArrowUp' && dir.y === 0) directionRef.current = { x: 0, y: -1 }
      else if (e.key === 'ArrowDown' && dir.y === 0) directionRef.current = { x: 0, y: 1 }
      else if (e.key === 'ArrowLeft' && dir.x === 0) directionRef.current = { x: -1, y: 0 }
      else if (e.key === 'ArrowRight' && dir.x === 0) directionRef.current = { x: 1, y: 0 }
    }
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const loop = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now
      const dt = now - lastFrameRef.current
      lastFrameRef.current = now

      if (startedRef.current && !gameOverRef.current && !pausedRef.current) {
        stepAccumRef.current += dt
        while (stepAccumRef.current >= STEP_MS) {
          stepAccumRef.current -= STEP_MS
          step()
        }
      }

      if (dirtyRef.current && draw()) {
        dirtyRef.current = false
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    dirtyRef.current = true
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw, step])

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Snake</h1>
      <p style={{ marginBottom: '1rem' }}>Score: {score}</p>

      <div style={{ position: 'relative', border: '2px solid var(--color-panel-text)', borderRadius: '8px', overflow: 'hidden', lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', background: 'var(--color-panel-background)', colorScheme: 'light' }}
        />
        {started && !gameOver && !paused && (
          <button
            onClick={() => setPaused(true)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '0.25rem 0.75rem',
              background: 'var(--color-text)',
              color: 'var(--color-background)',
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
              background: 'color-mix(in srgb, var(--color-panel-background) 92%, transparent)',
              color: 'var(--color-panel-text)',
              borderRadius: '8px',
            }}
          >
            {paused && !gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Paused</p>}
            {gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Game Over! Score: {score}</p>}
            <button
              onClick={paused ? () => setPaused(false) : resetGame}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
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

      <p style={{ marginTop: '1rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>Use arrow keys to move · P pause</p>
    </main>
  )
}
