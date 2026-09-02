'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDomeSession } from '@/components/DomeSession'
import { readCssVar, THEME_CHANGE_EVENT } from '@/lib/themes'
import GameCanvasFrame from '@/components/GameCanvasFrame'
import SnakeShopPanel from '@/components/SnakeShopPanel'
import { SNAKE_UPGRADE_PRICES, SnakeUpgrades } from '@/lib/snake/shop'

const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
/** Snap period — one integer cell per beat. Not a lerp / dt tween. */
const STEP_MS = 120
const GUARD_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'p', 'P', ' '])

type Point = { x: number; y: number }

type Food = Point & { kind: 'apple' | 'coin' }

const randomFood = (snake: Point[], foods: Food[], kind: Food['kind']): Food => {
  let food: Point
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (snake.some((s) => s.x === food.x && s.y === food.y) || foods.some((f) => f.x === food.x && f.y === food.y))
  return { ...food, kind }
}

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { user } = useDomeSession()
  const [supabase] = useState(() => createClient())

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }])
  const foodRef = useRef<Food[]>([{ x: 15, y: 10, kind: 'apple' }])
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
  const [coins, setCoins] = useState(0)
  const [upgrades, setUpgrades] = useState<SnakeUpgrades>({ extraApples: 0, slowDown: false, shield: false })
  const [shopOpen, setShopOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [slowCharge, setSlowCharge] = useState(5)
  const [slowActive, setSlowActive] = useState(false)
  const [shieldAvailable, setShieldAvailable] = useState(false)
  const upgradesRef = useRef(upgrades)
  const slowChargeRef = useRef(5)
  const slowHeldRef = useRef(false)
  const shieldRef = useRef(false)
  const submittedRef = useRef(false)

  const startedRef = useRef(started)
  const gameOverRef = useRef(gameOver)
  const pausedRef = useRef(paused)

  useEffect(() => {
    startedRef.current = started
    gameOverRef.current = gameOver
    pausedRef.current = paused
  }, [started, gameOver, paused])

  useEffect(() => {
    upgradesRef.current = upgrades
    shieldRef.current = shieldAvailable
  }, [upgrades, shieldAvailable])

  useEffect(() => {
    if (!user) return
    const loadSnakeShop = async () => {
      const { data: profile } = await supabase.from('profiles').select('snake_coins, snake_extra_apples, snake_slow_down, snake_shield').eq('id', user.id).single()
      setCoins(profile?.snake_coins ?? 0)
      setUpgrades({ extraApples: profile?.snake_extra_apples ?? 0, slowDown: profile?.snake_slow_down ?? false, shield: profile?.snake_shield ?? false })
      setShieldAvailable(profile?.snake_shield ?? false)
    }
    loadSnakeShop()
  }, [supabase, user])

  const earnCoins = useCallback(async (amount: number) => {
    const { data, error } = await supabase.rpc('snake_earn_coins', { p_amount: amount })
    if (!error && typeof data === 'number') setCoins(data)
  }, [supabase])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return false

    ctx.fillStyle = readCssVar('--color-panel-background', '#fafafa')
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const themeFoodColor = readCssVar('--color-accent-secondary', '#FFAE00')
    foodRef.current.forEach((food) => {
      ctx.fillStyle = food.kind === 'coin' ? '#FFD23F' : themeFoodColor
      if (food.kind === 'coin') {
        ctx.beginPath()
        ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
      }
    })

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
      if (shieldRef.current) {
        shieldRef.current = false
        setShieldAvailable(false)
        snakeRef.current = [{ x: 10, y: 10 }]
        directionRef.current = { x: 1, y: 0 }
        lastAppliedDirection.current = { x: 1, y: 0 }
        dirtyRef.current = true
      } else {
        setGameOver(true)
      }
      return
    }

    const newSnake = [newHead, ...prevSnake]
    const eatenIndex = foodRef.current.findIndex((food) => newHead.x === food.x && newHead.y === food.y)
    if (eatenIndex !== -1) {
      const eaten = foodRef.current[eatenIndex]
      setScore((s) => s + 1)
      if (eaten.kind === 'coin') earnCoins(1)
      slowChargeRef.current = Math.min(5, slowChargeRef.current + 1)
      setSlowCharge(slowChargeRef.current)
      const nextFoods = foodRef.current.filter((_, index) => index !== eatenIndex)
      const replacementFoods = [...nextFoods, randomFood(newSnake, nextFoods, 'apple')]
      if (eaten.kind === 'apple' && Math.random() < 0.12) {
        replacementFoods.push(randomFood(newSnake, replacementFoods, 'coin'))
      }
      foodRef.current = replacementFoods
    } else {
      newSnake.pop()
    }

    snakeRef.current = newSnake
    dirtyRef.current = true
  }, [earnCoins])

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }]
    snakeRef.current = initialSnake
    const initialFoods: Food[] = []
    foodRef.current = Array.from({ length: 1 + upgradesRef.current.extraApples }, () => {
      const food = randomFood(initialSnake, initialFoods, 'apple')
      initialFoods.push(food)
      return food
    })
    directionRef.current = { x: 1, y: 0 }
    lastAppliedDirection.current = { x: 1, y: 0 }
    stepAccumRef.current = 0
    lastFrameRef.current = 0
    dirtyRef.current = true
    setScore(0)
    setGameOver(false)
    setPaused(false)
    slowChargeRef.current = 5
    setSlowCharge(5)
    setSlowActive(false)
    setShieldAvailable(upgradesRef.current.shield)
    submittedRef.current = false
    setStarted(true)
  }

  const spendCoins = useCallback(async (amount: number) => {
    const { data, error } = await supabase.rpc('snake_spend_coins', { p_amount: amount })
    if (error || typeof data !== 'number') {
      setSyncError(error?.message || 'Not enough coins for that purchase.')
      return null
    }
    setCoins(data)
    return data
  }, [supabase])

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || finalScore <= 0) return
    const { error } = await supabase.rpc('submit_game_score', { p_game: 'snake', p_score: finalScore })
    if (error) console.error('[snake] failed to submit score:', error.message, error)
  }, [supabase, user])

  const buyUpgrade = async (key: keyof typeof SNAKE_UPGRADE_PRICES) => {
    if (!user || busyKey) return
    const price = SNAKE_UPGRADE_PRICES[key]
    if ((key === 'slowDown' && upgrades.slowDown) || (key === 'shield' && upgrades.shield)) return
    setBusyKey(key)
    const balance = await spendCoins(price)
    if (balance === null) { setBusyKey(null); return }
    const next = { ...upgrades, [key]: key === 'extraApples' ? upgrades.extraApples + 1 : true }
    const column = key === 'extraApples' ? 'snake_extra_apples' : key === 'slowDown' ? 'snake_slow_down' : 'snake_shield'
    const { error } = await supabase.from('profiles').update({ [column]: next[key] }).eq('id', user.id)
    if (error) {
      await supabase.rpc('snake_earn_coins', { p_amount: price })
      setCoins(balance + price)
      setSyncError(`Purchase didn't save: ${error.message}`)
    } else {
      setUpgrades(next)
      if (key === 'shield') setShieldAvailable(true)
      setSyncError(null)
    }
    setBusyKey(null)
  }

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
      if (e.key === ' ') {
        if (upgradesRef.current.slowDown && startedRef.current && !gameOverRef.current) {
          e.preventDefault()
          slowHeldRef.current = true
        }
        return
      }
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
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') slowHeldRef.current = false }
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('keyup', handleKeyUp)
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp) }
  }, [])

  useEffect(() => {
    const loop = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now
      const dt = now - lastFrameRef.current
      lastFrameRef.current = now

      if (startedRef.current && !gameOverRef.current && !pausedRef.current) {
        const slowing = slowHeldRef.current && slowChargeRef.current > 0 && upgradesRef.current.slowDown
        if (slowing) {
          slowChargeRef.current = Math.max(0, slowChargeRef.current - dt / 1000)
          setSlowCharge(slowChargeRef.current)
        }
        setSlowActive(slowing)
        stepAccumRef.current += dt
        const stepMs = slowing ? STEP_MS * 2 : STEP_MS
        while (stepAccumRef.current >= stepMs) {
          stepAccumRef.current -= stepMs
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}><h1 style={{ color: 'var(--color-accent)', margin: 0 }}>Snake</h1><button onClick={() => setShopOpen(true)} style={{ padding: '0.4rem 0.9rem', background: 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Shop - Coins {coins}</button></div>
      <p style={{ marginBottom: '1rem' }}>Score: {score}</p>

      {syncError && <p style={{ color: '#a21112', fontSize: '0.8rem' }}>{syncError}</p>}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <aside style={{ width: 130, border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem', color: 'var(--color-panel-text)', fontSize: '0.8rem' }}>
        <strong>Snake status</strong><p style={{ margin: '0.75rem 0 0.5rem' }}>Shield: {shieldAvailable ? 'READY' : 'NONE'}</p><p style={{ margin: '0 0 0.5rem' }}>Time control</p><div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4 }}><div style={{ height: '100%', width: `${slowCharge / 5 * 100}%`, background: slowActive ? '#3BCEAC' : 'var(--color-accent)', borderRadius: 4 }} /></div><small>{upgrades.slowDown ? `${slowCharge.toFixed(1)}s ${slowActive ? 'active' : 'available'}` : 'Shop upgrade'}</small>
      </aside>
      <GameCanvasFrame>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', background: 'var(--color-panel-background)' }}
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
      </GameCanvasFrame>
      </div>

      <p style={{ marginTop: '1rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>Use arrow keys to move · Hold Space to slow down · P pause</p>
      {shopOpen && <SnakeShopPanel open={shopOpen} onClose={() => setShopOpen(false)} coins={coins} upgrades={upgrades} busyKey={busyKey} onBuyUpgrade={buyUpgrade} />}
    </main>
  )
}
