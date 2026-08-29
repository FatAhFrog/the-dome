'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { TetrisUpgrades } from '@/lib/tetris/shop'
import {
  DEFAULT_PIECE_COLORS,
  THEME_CHANGE_EVENT,
  getPieceColorsFromDOM,
  readCssVar,
  type PieceKey,
} from '@/lib/themes'
import {
  CELL,
  COLS,
  PIECE_TYPES,
  ROWS,
  SHAPES,
  emptyBoard,
  getCells,
  type ActivePiece,
  type Board,
} from '@/lib/tetris/shapes'

const DECAY = 12
const GUARD_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', '/'])
const LOW_SPAWN_START_LEVEL = 2
const LINE_SCORES = [0, 100, 300, 500, 800] as const

export type TetrisHud = {
  score: number
  lines: number
  level: number
  started: boolean
  paused: boolean
  gameOver: boolean
}

/** Live counters for the metrics child — do not put samples on the Tetris page. */
export type TetrisMetricsSource = {
  score: number
  lines: number
  moves: number
  speedMs: number
  gameStart: number
  started: boolean
  gameOver: boolean
}

const INITIAL_HUD: TetrisHud = {
  score: 0,
  lines: 0,
  level: 1,
  started: false,
  paused: false,
  gameOver: false,
}

function isValidPosition(piece: ActivePiece, testBoard: Board) {
  return getCells(piece).every(([x, y]) => {
    if (x < 0 || x >= COLS || y >= ROWS) return false
    if (y < 0) return true
    return !testBoard[y][x]
  })
}

function ghostPieceFor(piece: ActivePiece, testBoard: Board): ActivePiece {
  let dropped = piece
  while (isValidPosition({ ...dropped, y: dropped.y + 1 }, testBoard)) dropped = { ...dropped, y: dropped.y + 1 }
  return dropped
}

function gravityMs(level: number, speedLevel: number) {
  return Math.max(150 + speedLevel * 15, 800 - (level - 1) * Math.max(20, 60 - speedLevel * 6))
}

/**
 * Owns the Tetris clock and canvas.
 * Board/active/next/hold live in refs; React only sees HUD (score/lines/overlay).
 * Gravity accumulates in one rAF loop so locking a piece does not reset the timer.
 */
export function useTetrisGame({
  canvasRef,
  nextCanvasRef,
  holdCanvasRef,
  upgrades,
  nextCellSize,
  onEarnCoins,
  onSubmitScore,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  nextCanvasRef: RefObject<HTMLCanvasElement | null>
  holdCanvasRef: RefObject<HTMLCanvasElement | null>
  upgrades: TetrisUpgrades
  nextCellSize: number
  onEarnCoins: (amount: number) => void
  onSubmitScore: (score: number) => void
}) {
  const [hud, setHud] = useState<TetrisHud>(INITIAL_HUD)

  const boardRef = useRef<Board>(emptyBoard())
  const activeRef = useRef<ActivePiece | null>(null)
  const nextTypeRef = useRef<PieceKey>('I')
  const holdTypeRef = useRef<PieceKey | null>(null)
  const canHoldRef = useRef(true)
  const streakTypeRef = useRef<PieceKey | null>(null)
  const streakCountRef = useRef(0)
  const dirtyRef = useRef(true)
  const gravityAccumRef = useRef(0)
  const lastFrameRef = useRef(0)
  const rafRef = useRef(0)
  const submittedRef = useRef(false)
  const moveCountRef = useRef(0)

  const hudRef = useRef(hud)
  const upgradesRef = useRef(upgrades)
  const nextCellSizeRef = useRef(nextCellSize)
  const onEarnCoinsRef = useRef(onEarnCoins)
  const onSubmitScoreRef = useRef(onSubmitScore)

  useEffect(() => {
    hudRef.current = hud
    upgradesRef.current = upgrades
    nextCellSizeRef.current = nextCellSize
    onEarnCoinsRef.current = onEarnCoins
    onSubmitScoreRef.current = onSubmitScore
  }, [hud, upgrades, nextCellSize, onEarnCoins, onSubmitScore])

  const pieceColorsRef = useRef(DEFAULT_PIECE_COLORS)
  const boardBgRef = useRef('#fafafa')
  const gridLineRef = useRef('#eeeeee')

  const metricsSource = useRef<TetrisMetricsSource>({
    score: 0,
    lines: 0,
    moves: 0,
    speedMs: 800,
    gameStart: 0,
    started: false,
    gameOver: false,
  })

  const syncMetrics = () => {
    const h = hudRef.current
    metricsSource.current.score = h.score
    metricsSource.current.lines = h.lines
    metricsSource.current.moves = moveCountRef.current
    metricsSource.current.started = h.started
    metricsSource.current.gameOver = h.gameOver
  }

  const pickPiece = useCallback((): PieceKey => {
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
      if (r <= 0) {
        chosen = PIECE_TYPES[i]
        break
      }
    }
    if (chosen === streakTypeRef.current) {
      streakCountRef.current += 1
    } else {
      streakTypeRef.current = chosen
      streakCountRef.current = 1
    }
    return chosen
  }, [])

  const spawnPiece = useCallback((type: PieceKey): ActivePiece => {
    return { type, rotation: 0, x: 3, y: upgradesRef.current.lowSpawn ? 0 : -2 }
  }, [])

  const drawMiniPiece = (canvas: HTMLCanvasElement | null, type: PieceKey | null, size: number) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = boardBgRef.current
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (!type) return
    const cells = SHAPES[type][0]
    const xs = cells.map(([x]) => x)
    const ys = cells.map(([, y]) => y)
    const pieceWidth = Math.max(...xs) - Math.min(...xs) + 1
    const pieceHeight = Math.max(...ys) - Math.min(...ys) + 1
    const offsetX = (4 - pieceWidth) / 2 - Math.min(...xs)
    const offsetY = (4 - pieceHeight) / 2 - Math.min(...ys)
    ctx.fillStyle = pieceColorsRef.current[type]
    cells.forEach(([x, y]) => {
      ctx.fillRect((x + offsetX) * size, (y + offsetY) * size, size - 1, size - 1)
    })
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return false

    ctx.fillStyle = boardBgRef.current
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

    const board = boardRef.current
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillStyle = pieceColorsRef.current[cell]
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
        }
      })
    })

    const active = activeRef.current
    if (active && upgradesRef.current.ghost) {
      const ghost = ghostPieceFor(active, board)
      if (ghost.y !== active.y) {
        ctx.save()
        ctx.globalAlpha = 0.25
        ctx.fillStyle = pieceColorsRef.current[ghost.type]
        getCells(ghost).forEach(([x, y]) => {
          if (y >= 0) ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
        })
        ctx.restore()
      }
    }
    if (active) {
      ctx.fillStyle = pieceColorsRef.current[active.type]
      getCells(active).forEach(([x, y]) => {
        if (y >= 0) ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1)
      })
    }

    ctx.strokeStyle = gridLineRef.current
    ctx.beginPath()
    for (let x = 0; x <= COLS; x++) {
      ctx.moveTo(x * CELL, 0)
      ctx.lineTo(x * CELL, ROWS * CELL)
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.moveTo(0, y * CELL)
      ctx.lineTo(COLS * CELL, y * CELL)
    }
    ctx.stroke()

    drawMiniPiece(nextCanvasRef.current, nextTypeRef.current, nextCellSizeRef.current)
    if (upgradesRef.current.hold) {
      drawMiniPiece(holdCanvasRef.current, holdTypeRef.current, nextCellSizeRef.current)
    }
    return true
  }, [canvasRef, holdCanvasRef, nextCanvasRef])

  const lockPiece = useCallback((piece: ActivePiece) => {
    const currentBoard = boardRef.current
    const newBoard = currentBoard.map((row) => [...row])
    getCells(piece).forEach(([x, y]) => {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        newBoard[y][x] = piece.type
      }
    })
    if (getCells(piece).some(([, y]) => y < 0)) {
      activeRef.current = null
      setHud((h) => ({ ...h, gameOver: true }))
      dirtyRef.current = true
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

    boardRef.current = filteredBoard
    canHoldRef.current = true

    const incoming = nextTypeRef.current
    nextTypeRef.current = pickPiece()
    const spawned = spawnPiece(incoming)
    const blocked = !isValidPosition(spawned, filteredBoard)
    activeRef.current = blocked ? null : spawned

    setHud((h) => {
      const nextLines = h.lines + clearedLines
      return {
        ...h,
        score: clearedLines > 0 ? h.score + LINE_SCORES[clearedLines] * h.level : h.score,
        lines: nextLines,
        level: clearedLines > 0 ? 1 + Math.floor(nextLines / 10) : h.level,
        gameOver: blocked || h.gameOver,
      }
    })

    if (clearedLines > 0) onEarnCoinsRef.current(clearedLines)
    dirtyRef.current = true
  }, [pickPiece, spawnPiece])

  const tryMove = (dx: number, dy: number) => {
    const piece = activeRef.current
    if (!piece) return false
    const moved = { ...piece, x: piece.x + dx, y: piece.y + dy }
    if (isValidPosition(moved, boardRef.current)) {
      activeRef.current = moved
      dirtyRef.current = true
      return true
    }
    return false
  }

  const tryRotate = () => {
    const piece = activeRef.current
    if (!piece) return
    const rotated = { ...piece, rotation: (piece.rotation + 1) % 4 }
    if (isValidPosition(rotated, boardRef.current)) {
      activeRef.current = rotated
      dirtyRef.current = true
      return
    }
    for (const kick of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, x: rotated.x + kick }
      if (isValidPosition(kicked, boardRef.current)) {
        activeRef.current = kicked
        dirtyRef.current = true
        return
      }
    }
  }

  const hardDrop = useCallback(() => {
    const piece = activeRef.current
    if (!piece) return
    lockPiece(ghostPieceFor(piece, boardRef.current))
  }, [lockPiece])

  const handleHold = useCallback(() => {
    if (!upgradesRef.current.hold || !canHoldRef.current) return
    const piece = activeRef.current
    if (!piece) return
    canHoldRef.current = false
    const swapType = holdTypeRef.current
    holdTypeRef.current = piece.type
    if (swapType === null) {
      const incoming = nextTypeRef.current
      nextTypeRef.current = pickPiece()
      const spawned = spawnPiece(incoming)
      if (!isValidPosition(spawned, boardRef.current)) {
        activeRef.current = null
        setHud((h) => ({ ...h, gameOver: true }))
      } else {
        activeRef.current = spawned
      }
    } else {
      const spawned = spawnPiece(swapType)
      if (!isValidPosition(spawned, boardRef.current)) {
        activeRef.current = null
        setHud((h) => ({ ...h, gameOver: true }))
      } else {
        activeRef.current = spawned
      }
    }
    dirtyRef.current = true
  }, [pickPiece, spawnPiece])

  const start = () => {
    boardRef.current = emptyBoard()
    holdTypeRef.current = null
    canHoldRef.current = true
    streakTypeRef.current = null
    streakCountRef.current = 0
    gravityAccumRef.current = 0
    lastFrameRef.current = 0
    submittedRef.current = false
    moveCountRef.current = 0
    const firstType = pickPiece()
    nextTypeRef.current = pickPiece()
    activeRef.current = spawnPiece(firstType)
    dirtyRef.current = true
    const startLevel = upgradesRef.current.lowSpawn ? LOW_SPAWN_START_LEVEL : 1
    metricsSource.current.gameStart = Date.now()
    setHud({
      score: 0,
      lines: 0,
      level: startLevel,
      started: true,
      paused: false,
      gameOver: false,
    })
  }

  const togglePause = () => {
    setHud((h) => {
      if (!h.started || h.gameOver) return h
      return { ...h, paused: !h.paused }
    })
  }

  const setPaused = (paused: boolean) => {
    setHud((h) => ({ ...h, paused }))
  }

  useEffect(() => {
    const readTheme = () => {
      pieceColorsRef.current = getPieceColorsFromDOM()
      boardBgRef.current = readCssVar('--color-panel-background', '#fafafa')
      gridLineRef.current = readCssVar('--color-border', '#eeeeee')
      dirtyRef.current = true
    }
    readTheme()
    window.addEventListener(THEME_CHANGE_EVENT, readTheme)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, readTheme)
  }, [])

  useEffect(() => {
    dirtyRef.current = true
  }, [upgrades.ghost, upgrades.hold, nextCellSize])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (GUARD_KEYS.has(e.key)) e.preventDefault()
      const h = hudRef.current
      if (!h.started || h.gameOver) return
      if (e.key === 'p' || e.key === 'P') {
        togglePause()
        return
      }
      if (h.paused) return
      moveCountRef.current += 1
      if (e.key === 'ArrowLeft') tryMove(-1, 0)
      else if (e.key === 'ArrowRight') tryMove(1, 0)
      else if (e.key === 'ArrowDown') tryMove(0, 1)
      else if (e.key === 'ArrowUp') tryRotate()
      else if (e.key === ' ') hardDrop()
      else if (e.key === '/') handleHold()
      else moveCountRef.current -= 1
    }
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hardDrop, handleHold])

  useEffect(() => {
    const loop = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now
      const dt = now - lastFrameRef.current
      lastFrameRef.current = now
      const h = hudRef.current

      if (h.started && !h.gameOver && !h.paused) {
        const speed = gravityMs(h.level, upgradesRef.current.speedLevel)
        metricsSource.current.speedMs = speed
        gravityAccumRef.current += dt
        while (gravityAccumRef.current >= speed) {
          gravityAccumRef.current -= speed
          const piece = activeRef.current
          if (!piece) break
          const moved = { ...piece, y: piece.y + 1 }
          if (isValidPosition(moved, boardRef.current)) {
            activeRef.current = moved
            dirtyRef.current = true
          } else {
            lockPiece(piece)
          }
        }
      }

      syncMetrics()
      if (dirtyRef.current && draw()) {
        dirtyRef.current = false
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw, lockPiece])

  useEffect(() => {
    if (hud.gameOver && !submittedRef.current) {
      submittedRef.current = true
      onSubmitScoreRef.current(hud.score)
    }
  }, [hud.gameOver, hud.score])

  useEffect(() => {
    return () => {
      const h = hudRef.current
      if (h.started && !h.gameOver && !submittedRef.current && h.score > 0) {
        submittedRef.current = true
        onSubmitScoreRef.current(h.score)
      }
    }
  }, [])

  return { hud, start, togglePause, setPaused, metricsSource }
}
