'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDomeSession } from '@/components/DomeSession'

const ROWS = 9
const COLS = 9
const MINE_COUNT = 10

type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

const emptyBoard = (): Cell[][] => Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })),
)

const neighbors = (row: number, col: number) => {
  const cells: [number, number][] = []
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) continue
      const nextRow = row + rowOffset
      const nextCol = col + colOffset
      if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) cells.push([nextRow, nextCol])
    }
  }
  return cells
}

const createBoard = (safeRow: number, safeCol: number) => {
  const board = emptyBoard()
  const blocked = new Set<string>([[safeRow, safeCol].join(':')])
  neighbors(safeRow, safeCol).forEach(([row, col]) => blocked.add([row, col].join(':')))
  const available: [number, number][] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!blocked.has([row, col].join(':'))) available.push([row, col])
    }
  }
  for (let index = available.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[available[index], available[swapIndex]] = [available[swapIndex], available[index]]
  }
  available.slice(0, MINE_COUNT).forEach(([row, col]) => { board[row][col].mine = true })
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      board[row][col].adjacent = neighbors(row, col).filter(([neighborRow, neighborCol]) => board[neighborRow][neighborCol].mine).length
    }
  }
  return board
}

export default function MinesweeperPage() {
  const { user } = useDomeSession()
  const [supabase] = useState(() => createClient())
  const [board, setBoard] = useState(emptyBoard)
  const [status, setStatus] = useState<GameStatus>('ready')
  const [seconds, setSeconds] = useState(0)
  const [revealedCount, setRevealedCount] = useState(0)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (status !== 'playing') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const reset = () => {
    setBoard(emptyBoard())
    setStatus('ready')
    setSeconds(0)
    setRevealedCount(0)
    submittedRef.current = false
  }

  const submitScore = async (elapsedSeconds: number) => {
    if (!user || submittedRef.current) return
    submittedRef.current = true
    const { error } = await supabase.rpc('submit_game_score', { p_game: 'minesweeper', p_score: Math.max(1, elapsedSeconds) })
    if (error) console.error('[minesweeper] failed to submit score:', error.message, error)
  }

  const reveal = (row: number, col: number) => {
    if (status === 'lost' || status === 'won' || board[row][col].flagged || board[row][col].revealed) return
    const activeBoard = status === 'ready' ? createBoard(row, col) : board.map((currentRow) => currentRow.map((cell) => ({ ...cell })))
    if (status === 'ready') setStatus('playing')

    if (activeBoard[row][col].mine) {
      activeBoard.forEach((currentRow) => currentRow.forEach((cell) => { if (cell.mine) cell.revealed = true }))
      setBoard(activeBoard)
      setStatus('lost')
      return
    }

    const pending: [number, number][] = [[row, col]]
    const visited = new Set<string>()
    let newlyRevealed = 0
    while (pending.length) {
      const [currentRow, currentCol] = pending.shift()!
      const key = [currentRow, currentCol].join(':')
      if (visited.has(key) || activeBoard[currentRow][currentCol].flagged || activeBoard[currentRow][currentCol].revealed) continue
      visited.add(key)
      activeBoard[currentRow][currentCol].revealed = true
      newlyRevealed++
      if (activeBoard[currentRow][currentCol].adjacent === 0) {
        neighbors(currentRow, currentCol).forEach(([neighborRow, neighborCol]) => pending.push([neighborRow, neighborCol]))
      }
    }

    const nextRevealedCount = revealedCount + newlyRevealed
    setRevealedCount(nextRevealedCount)
    setBoard(activeBoard)
    if (nextRevealedCount === ROWS * COLS - MINE_COUNT) {
      setStatus('won')
      void submitScore(seconds)
    }
  }

  const toggleFlag = (event: React.MouseEvent, row: number, col: number) => {
    event.preventDefault()
    if (status === 'lost' || status === 'won' || board[row][col].revealed) return
    setBoard((currentBoard) => currentBoard.map((currentRow, currentRowIndex) => currentRow.map((cell, currentColIndex) =>
      currentRowIndex === row && currentColIndex === col ? { ...cell, flagged: !cell.flagged } : cell,
    )))
  }

  return (
    <main style={{ padding: '2rem', color: 'var(--color-text)', maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: 'var(--color-accent)', marginBottom: '0.35rem' }}>Minesweeper</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: 0 }}>Beta board</p>

      <section style={{ marginTop: '1.5rem', padding: '1rem', width: 'min(100%, 420px)', boxSizing: 'border-box', background: 'var(--color-panel-background)', border: '2px solid var(--color-border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'var(--color-panel-text)' }}>
          <strong>Time: {seconds}s</strong>
          <span>{MINE_COUNT} mines</span>
        </div>
        <div role="grid" aria-label="Minesweeper board" style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, aspectRatio: '1', border: '2px solid var(--color-panel-text)' }}>
          {board.map((currentRow, row) => currentRow.map((cell, col) => {
            const label = cell.revealed ? (cell.mine ? 'Mine' : cell.adjacent ? `${cell.adjacent}` : 'Empty') : cell.flagged ? 'Flagged' : 'Hidden'
            return (
              <button
                key={`${row}-${col}`}
                type="button"
                role="gridcell"
                aria-label={`Row ${row + 1}, column ${col + 1}: ${label}`}
                onClick={() => reveal(row, col)}
                onContextMenu={(event) => toggleFlag(event, row, col)}
                style={{
                  position: 'relative',
                  minWidth: 0,
                  aspectRatio: '1',
                  padding: 0,
                  border: '1px solid var(--color-border)',
                  background: cell.revealed ? 'var(--color-background)' : 'var(--color-accent)',
                  color: cell.mine ? 'var(--color-accent)' : 'var(--color-text)',
                  fontWeight: 700,
                  cursor: status === 'won' || status === 'lost' ? 'default' : 'pointer',
                }}
              >
                {cell.revealed ? (cell.mine ? 'X' : cell.adjacent || '') : cell.flagged ? <span style={{ position: 'relative', zIndex: 1, display: 'block', color: 'var(--color-panel-text)', fontSize: '1.1em', lineHeight: 1 }}>⚑</span> : ''}
              </button>
            )
          }))}
        </div>
        <div style={{ minHeight: '2.5rem', marginTop: '1rem', color: 'var(--color-panel-text)', textAlign: 'center' }}>
          {status === 'ready' && <span>Click a square to start.</span>}
          {status === 'playing' && <span>Right-click a square to flag it.</span>}
          {status === 'won' && <strong>Cleared in {seconds} seconds.</strong>}
          {status === 'lost' && <strong>Mine hit. Try again.</strong>}
        </div>
        <button type="button" onClick={reset} style={{ display: 'block', margin: '0 auto', padding: '0.5rem 1rem', background: 'var(--color-accent)', color: 'var(--color-on-accent)', border: 0, borderRadius: '6px', cursor: 'pointer' }}>
          {status === 'ready' ? 'Reset board' : 'New game'}
        </button>
      </section>
    </main>
  )
}
