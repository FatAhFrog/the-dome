'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ShopPanel, { TetrisUpgrades, UPGRADE_PRICES, MAX_SPEED_LEVEL, speedLevelPrice } from '@/components/ShopPanel'
import { ThemeKey, THEME_PRICE } from '@/lib/themes'

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

const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

type ActivePiece = {
  type: string
  rotation: number
  x: number
  y: number
}

const DEFAULT_UPGRADES: TetrisUpgrades = { lowSpawn: false, speedLevel: 0, ghost: false, hold: false }
const GUARD_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', '/'])
const LOW_SPAWN_START_LEVEL = 2

export default function TetrisPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const holdCanvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [active, setActive] = useState<ActivePiece | null>(null)
  const [nextType, setNextType] = useState<string>('I')
  const [holdType, setHoldType] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [nextCellSize, setNextCellSize] = useState(22)
  const [coins, setCoins] = useState(0)
  const [upgrades, setUpgrades] = useState<TetrisUpgrades>(DEFAULT_UPGRADES)
  const [ownedThemeKeys, setOwnedThemeKeys] = useState<string[]>([])
  const [shopOpen, setShopOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const submittedRef = useRef(false)
  const streakTypeRef = useRef<string | null>(null)
  const streakCountRef = useRef(0)
  const userIdRef = useRef<string | null>(null)
  const canHoldRef = useRef(true)
  const holdTypeRef = useRef<string | null>(null)

  // Higher DECAY makes repeated pieces rarer faster.
  const DECAY = 12

  const drawPiece = useCallback(() => {
    const weights = PIECE_TYPES.map((type) => {
      if (type === streakTypeRef.current) {
        if (streakCountRef.current >= 3) return 0
        return 1 / Math.pow(DECAY, streakCountRef.current)
      }
      return 1
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let chosen = PIECE_TYPES[PIECE_TYPES.length - 1]
    for (let i = 0; i < PIECE_TYPES.length; i++) {
      r -= weights[i]
      if (r <= 0) { chosen = PIECE_TYPES[i]; break }
    }

    if (chosen === streakTypeRef.current) {
      streakCountRef.current += 1
    } else {
      streakTypeRef.current = chosen
      streakCountRef.current = 1
    }

    return chosen
  }, [])

  const boardRef = useRef(board)
  const activeRef = useRef(active)
  const upgradesRef = useRef(upgrades)
  useEffect(() => {
    boardRef.current = board
    activeRef.current = active
    upgradesRef.current = upgrades
    holdTypeRef.current = holdType
  }, [board, active, upgrades, holdType])

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tetris_next_preview_size, coins, tetris_upgrade_low_spawn, tetris_upgrade_speed_level, tetris_upgrade_ghost, tetris_upgrade_hold')
        .eq('id', user.id)
        .single()
      if (profile?.tetris_next_preview_size) setNextCellSize(profile.tetris_next_preview_size)
      setCoins(profile?.coins ?? 0)
      setUpgrades({ lowSpawn: profile?.tetris_upgrade_low_spawn ?? false, speedLevel: profile?.tetris_upgrade_speed_level ?? 0, ghost: profile?.tetris_upgrade_ghost ?? false, hold: profile?.tetris_upgrade_hold ?? false })
      const { data: purchases } = await supabase.from('theme_purchases').select('theme_key').eq('user_id', user.id)
      setOwnedThemeKeys((purchases || []).map((p) => p.theme_key))
    }
    loadProfile()
  }, [supabase])

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
    return { type, rotation: 0, x: 3, y: upgradesRef.current.lowSpawn ? 0 : -2 }
  }, [])

  const ghostPieceFor = (piece: ActivePiece, testBoard: Board): ActivePiece => {
    let dropped = piece
    while (isValidPosition({ ...dropped, y: dropped.y + 1 }, testBoard)) dropped = { ...dropped, y: dropped.y + 1 }
    return dropped
  }

  const [syncError, setSyncError] = useState<string | null>(null)

  const earnCoins = useCallback(async (amount: number) => {
    if (!userIdRef.current || amount <= 0) return
    const { data, error } = await supabase.rpc('earn_coins', { p_amount: amount })
    if (error) {
      console.error('[tetris] failed to save earned coins:', error.message, error)
      setSyncError(`Coins didn't save: ${error.message}`)
      return
    }
    if (typeof data === 'number') {
      setCoins(data)
      setSyncError(null)
    }
  }, [supabase])

  const spendCoins = useCallback(async (amount: number): Promise<number | null> => {
    if (!userIdRef.current || amount <= 0) return null
    const { data, error } = await supabase.rpc('spend_coins', { p_amount: amount })
    if (error) {
      console.error('[tetris] failed to spend coins:', error.message, error)
      setSyncError(`Purchase didn't save: ${error.message}`)
      return null
    }
    if (data === null) {
      setSyncError('Not enough coins for that purchase.')
      return null
    }
    setCoins(data)
    setSyncError(null)
    return data
  }, [supabase])

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
      void earnCoins(clearedLines)
    }

    setBoard(filteredBoard)
    canHoldRef.current = true

    const newType = nextType
    const upcoming = drawPiece()
    setNextType(upcoming)
    const spawned = spawnPiece(newType)

    if (!isValidPosition(spawned, filteredBoard)) {
      setGameOver(true)
      setActive(null)
    } else {
      setActive(spawned)
    }
  }, [nextType, spawnPiece, level, drawPiece, earnCoins])

  const resetGame = () => {
    const fresh = emptyBoard()
    setBoard(fresh)
    setScore(0)
    setLines(0)
    setLevel(upgradesRef.current.lowSpawn ? LOW_SPAWN_START_LEVEL : 1)
    setGameOver(false)
    submittedRef.current = false
    setPaused(false)
    setHoldType(null)
    holdTypeRef.current = null
    canHoldRef.current = true
    streakTypeRef.current = null
    streakCountRef.current = 0
    const firstType = drawPiece()
    const secondType = drawPiece()
    setNextType(secondType)
    setActive(spawnPiece(firstType))
    setStarted(true)
  }

  const submitScore = useCallback(async (finalScore: number) => {
    const userId = userIdRef.current
    if (!userId || finalScore <= 0) return
    await supabase.from('scores').insert({ user_id: userId, game: 'tetris', score: finalScore })
  }, [supabase])

  useEffect(() => {
    if (gameOver && !submittedRef.current) {
      submittedRef.current = true
      submitScore(score)
    }
  }, [gameOver, score, submitScore])

  const startedRef = useRef(started)
  const gameOverRef = useRef(gameOver)
  const scoreRef = useRef(score)
  const submitScoreRef = useRef(submitScore)
  useEffect(() => {
    startedRef.current = started
    gameOverRef.current = gameOver
    scoreRef.current = score
    submitScoreRef.current = submitScore
  }, [started, gameOver, score, submitScore])

  useEffect(() => {
    return () => {
      if (startedRef.current && !gameOverRef.current && !submittedRef.current && scoreRef.current > 0) {
        submittedRef.current = true
        void submitScoreRef.current(scoreRef.current)
      }
    }
  }, [])

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
    const dropped = ghostPieceFor(piece, boardRef.current)
    setActive(dropped)
    lockPiece(dropped, boardRef.current)
  }, [lockPiece])

  const handleHold = useCallback(() => {
    if (!upgradesRef.current.hold || !canHoldRef.current) return
    const piece = activeRef.current
    if (!piece) return
    canHoldRef.current = false
    const swapType = holdTypeRef.current
    holdTypeRef.current = piece.type
    setHoldType(piece.type)
    if (swapType === null) {
      const newType = nextType
      setNextType(drawPiece())
      const spawned = spawnPiece(newType)
      if (!isValidPosition(spawned, boardRef.current)) { setGameOver(true); setActive(null) } else setActive(spawned)
    } else {
      const spawned = spawnPiece(swapType)
      if (!isValidPosition(spawned, boardRef.current)) { setGameOver(true); setActive(null) } else setActive(spawned)
    }
  }, [nextType, drawPiece, spawnPiece])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (GUARD_KEYS.has(e.key)) e.preventDefault()
      if (!started || gameOver) return
      if (e.key === 'p' || e.key === 'P') { setPaused((p) => !p); return }
      if (paused) return
      if (e.key === 'ArrowLeft') tryMove(-1, 0)
      else if (e.key === 'ArrowRight') tryMove(1, 0)
      else if (e.key === 'ArrowDown') tryMove(0, 1)
      else if (e.key === 'ArrowUp') tryRotate()
      else if (e.key === ' ') hardDrop()
      else if (e.key === '/') handleHold()
    }
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameOver, paused, tryMove, tryRotate, hardDrop, handleHold])

  useEffect(() => {
    if (!started || gameOver || paused) return
    const { speedLevel } = upgrades
    const speed = Math.max(150 + speedLevel * 15, 800 - (level - 1) * Math.max(20, 60 - speedLevel * 6))
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
  }, [started, gameOver, paused, level, lockPiece, upgrades])

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

    if (active && upgrades.ghost) {
      const ghost = ghostPieceFor(active, board)
      if (ghost.y !== active.y) {
        ctx.save()
        ctx.globalAlpha = 0.25
        ctx.fillStyle = COLORS[ghost.type]
        getCells(ghost).forEach(([x, y]) => { if (y >= 0) ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1) })
        ctx.restore()
      }
    }
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
  }, [board, active, upgrades.ghost])

  const drawMiniPiece = (canvas: HTMLCanvasElement | null, type: string | null, size: number) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (!type) return
    const cells = SHAPES[type][0]
    const xs = cells.map(([x]) => x)
    const ys = cells.map(([, y]) => y)
    const pieceWidth = Math.max(...xs) - Math.min(...xs) + 1
    const pieceHeight = Math.max(...ys) - Math.min(...ys) + 1
    const offsetX = (4 - pieceWidth) / 2 - Math.min(...xs)
    const offsetY = (4 - pieceHeight) / 2 - Math.min(...ys)

    ctx.fillStyle = COLORS[type]
    cells.forEach(([x, y]) => {
      ctx.fillRect((x + offsetX) * size, (y + offsetY) * size, size - 1, size - 1)
    })
  }

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    drawMiniPiece(nextCanvasRef.current, nextType, nextCellSize)
  }, [nextType, nextCellSize])

  useEffect(() => {
    drawMiniPiece(holdCanvasRef.current, holdType, nextCellSize)
  }, [holdType, nextCellSize])

  const buyUpgrade = async (key: 'lowSpawn' | 'speed' | 'ghost' | 'hold') => {
    const userId = userIdRef.current
    if (!userId || busyKey) return
    let price: number
    let column: string
    let nextUpgrades: TetrisUpgrades
    if (key === 'speed') {
      if (upgrades.speedLevel >= MAX_SPEED_LEVEL) return
      price = speedLevelPrice(upgrades.speedLevel)
      column = 'tetris_upgrade_speed_level'
      nextUpgrades = { ...upgrades, speedLevel: upgrades.speedLevel + 1 }
    } else {
      if (upgrades[key]) return
      price = UPGRADE_PRICES[key]
      column = key === 'lowSpawn' ? 'tetris_upgrade_low_spawn' : `tetris_upgrade_${key}`
      nextUpgrades = { ...upgrades, [key]: true }
    }
    if (coins < price) return
    setBusyKey(key)
    const balanceAfterSpend = await spendCoins(price)
    if (balanceAfterSpend === null) { setBusyKey(null); return }
    const { error } = await supabase.from('profiles').update({ [column]: key === 'speed' ? nextUpgrades.speedLevel : true }).eq('id', userId)
    if (!error) {
      setUpgrades(nextUpgrades)
      setSyncError(null)
    } else {
      await earnCoins(price)
      setSyncError(`Purchase didn't save (coins refunded): ${error.message}`)
    }
    setBusyKey(null)
  }

  const buyTheme = async (themeKey: ThemeKey, customName: string) => {
    const userId = userIdRef.current
    if (!userId || busyKey || coins < THEME_PRICE || ownedThemeKeys.includes(themeKey)) return
    setBusyKey(`theme:${themeKey}`)
    const balanceAfterSpend = await spendCoins(THEME_PRICE)
    if (balanceAfterSpend === null) { setBusyKey(null); return }
    const { error } = await supabase.from('theme_purchases').insert({ user_id: userId, theme_key: themeKey, custom_name: customName })
    if (!error) {
      setOwnedThemeKeys((keys) => [...keys, themeKey])
      setSyncError(null)
    } else {
      await earnCoins(THEME_PRICE)
      setSyncError(`Theme purchase didn't save (coins refunded): ${error.message}`)
    }
    setBusyKey(null)
  }

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--color-accent)', margin: 0 }}>Tetris</h1>
        <button onClick={() => setShopOpen(true)} style={{ padding: '0.4rem 0.9rem', background: 'var(--color-accent)', color: 'var(--color-on-accent, #fff)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Shop - Coins {coins}</button>
      </div>

      {syncError && <p style={{ background: '#fee', color: '#a21112', border: '1px solid #f5cccc', borderRadius: '6px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', marginBottom: '1rem', maxWidth: 500, textAlign: 'center' }}>{syncError}</p>}

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', width: COLS * CELL, justifyContent: 'center' }}>
            <p>Score: {score}</p>
            <p>Lines: {lines}</p>
            <p>Level: {level}</p>
          </div>

          <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            style={{ border: '2px solid #1A1A1A', borderRadius: '8px' }}
          />
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
              {gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Game Over! Score: {upgrades.lowSpawn ? Math.round(score * 1.1) : score}</p>}
              <button
                onClick={paused ? () => setPaused(false) : resetGame}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: 'var(--color-accent)',
                  color: 'var(--color-on-accent, #fff)',
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ border: '2px solid #1A1A1A', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>NEXT</p>
            <canvas ref={nextCanvasRef} width={4 * nextCellSize} height={4 * nextCellSize} />
          </div>
          {upgrades.hold && <div style={{ border: '2px solid #1A1A1A', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>HOLD</p>
            <canvas ref={holdCanvasRef} width={4 * nextCellSize} height={4 * nextCellSize} />
          </div>}
          {started && !gameOver && <button onClick={() => setPaused((p) => !p)} style={{ padding: '0.5rem 0.75rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{paused ? 'Resume' : 'Pause'}</button>}
        </div>
      </div>

      <p style={{ marginTop: '1rem', color: '#999', fontSize: '0.9rem' }}>
        ← → move · ↓ soft drop · ↑ rotate · Space hard drop · P pause{upgrades.hold && ' · / hold'}
      </p>
      <ShopPanel open={shopOpen} onClose={() => setShopOpen(false)} coins={coins} upgrades={upgrades} ownedThemeKeys={ownedThemeKeys} busyKey={busyKey} onBuyUpgrade={buyUpgrade} onBuyTheme={buyTheme} />
    </main>
  )
}