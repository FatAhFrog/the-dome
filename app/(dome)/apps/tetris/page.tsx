'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useDomeSession } from '@/components/DomeSession'
import { ThemeKey, THEME_PRICE } from '@/lib/themes'
import { CELL, COLS, ROWS } from '@/lib/tetris/shapes'
import { MAX_SPEED_LEVEL, UPGRADE_PRICES, speedLevelPrice, type TetrisUpgrades } from '@/lib/tetris/shop'
import { useTetrisGame } from '@/lib/tetris/useTetrisGame'

const ShopPanel = dynamic(() => import('@/components/ShopPanel'), { ssr: false })
const TetrisMetricsPanel = dynamic(() => import('@/components/TetrisMetricsPanel'), { ssr: false })

const DEFAULT_UPGRADES: TetrisUpgrades = { lowSpawn: false, speedLevel: 0, ghost: false, hold: false }

export default function TetrisPage() {
  const { user } = useDomeSession()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)
  const holdCanvasRef = useRef<HTMLCanvasElement>(null)

  const [coins, setCoins] = useState(0)
  const [upgrades, setUpgrades] = useState<TetrisUpgrades>(DEFAULT_UPGRADES)
  const [ownedThemeKeys, setOwnedThemeKeys] = useState<string[]>([])
  const [shopOpen, setShopOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [nextCellSize, setNextCellSize] = useState(22)
  const [metricsMode, setMetricsMode] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('tetris_next_preview_size, coins, tetris_upgrade_low_spawn, tetris_upgrade_speed_level, tetris_upgrade_ghost, tetris_upgrade_hold, metrics_mode_tetris')
        .eq('id', user.id)
        .single()
      if (profile?.tetris_next_preview_size) setNextCellSize(profile.tetris_next_preview_size)
      setCoins(profile?.coins ?? 0)
      setUpgrades({
        lowSpawn: profile?.tetris_upgrade_low_spawn ?? false,
        speedLevel: profile?.tetris_upgrade_speed_level ?? 0,
        ghost: profile?.tetris_upgrade_ghost ?? false,
        hold: profile?.tetris_upgrade_hold ?? false,
      })
      setMetricsMode(profile?.metrics_mode_tetris ?? false)
      const { data: purchases } = await supabase.from('theme_purchases').select('theme_key').eq('user_id', user.id)
      setOwnedThemeKeys((purchases || []).map((p) => p.theme_key))
    }
    loadProfile()
  }, [supabase, user])

  const earnCoins = useCallback(async (amount: number) => {
    if (!user || amount <= 0) return
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
  }, [supabase, user])

  const spendCoins = useCallback(async (amount: number): Promise<number | null> => {
    if (!user || amount <= 0) return null
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
  }, [supabase, user])

  const submitScore = useCallback(async (finalScore: number) => {
    if (!user || finalScore <= 0) return
    const { error } = await supabase.rpc('submit_game_score', { p_game: 'tetris', p_score: finalScore })
    if (error) {
      console.error('[tetris] failed to submit score:', error.message, error)
      setSyncError(`Score didn't save: ${error.message}`)
    }
  }, [supabase, user])

  const { hud, start, togglePause, setPaused, metricsSource } = useTetrisGame({
    canvasRef,
    nextCanvasRef,
    holdCanvasRef,
    upgrades,
    nextCellSize,
    onEarnCoins: earnCoins,
    onSubmitScore: submitScore,
  })

  const buyUpgrade = async (key: 'lowSpawn' | 'speed' | 'ghost' | 'hold') => {
    if (!user || busyKey) return
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
    const { error } = await supabase.from('profiles').update({ [column]: key === 'speed' ? nextUpgrades.speedLevel : true }).eq('id', user.id)
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
    if (!user || busyKey || coins < THEME_PRICE || ownedThemeKeys.includes(themeKey)) return
    setBusyKey(`theme:${themeKey}`)
    const balanceAfterSpend = await spendCoins(THEME_PRICE)
    if (balanceAfterSpend === null) { setBusyKey(null); return }
    const { error } = await supabase.from('theme_purchases').insert({ user_id: user.id, theme_key: themeKey, custom_name: customName })
    if (!error) {
      setOwnedThemeKeys((keys) => [...keys, themeKey])
      setSyncError(null)
    } else {
      await earnCoins(THEME_PRICE)
      setSyncError(`Theme purchase didn't save (coins refunded): ${error.message}`)
    }
    setBusyKey(null)
  }

  const { score, lines, level, started, paused, gameOver } = hud

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
            style={{ border: '2px solid var(--color-panel-text)', borderRadius: '8px' }}
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
                background: 'color-mix(in srgb, var(--color-panel-background) 92%, transparent)',
                color: 'var(--color-panel-text)',
                borderRadius: '8px',
              }}
            >
              {paused && !gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Paused</p>}
              {gameOver && <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Game Over! Score: {upgrades.lowSpawn ? Math.round(score * 1.1) : score}</p>}
              <button
                onClick={paused ? () => setPaused(false) : start}
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
          <div style={{ border: '2px solid var(--color-panel-text)', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--color-panel-background)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-panel-text)', opacity: 0.65, fontWeight: 600 }}>NEXT</p>
            <canvas ref={nextCanvasRef} width={4 * nextCellSize} height={4 * nextCellSize} />
          </div>
          {upgrades.hold && <div style={{ border: '2px solid var(--color-panel-text)', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'var(--color-panel-background)' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-panel-text)', opacity: 0.65, fontWeight: 600 }}>HOLD</p>
            <canvas ref={holdCanvasRef} width={4 * nextCellSize} height={4 * nextCellSize} />
          </div>}
          {started && !gameOver && <button onClick={togglePause} style={{ padding: '0.5rem 0.75rem', background: 'var(--color-accent-secondary)', color: 'var(--color-on-accent, #fff)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{paused ? 'Resume' : 'Pause'}</button>}
        </div>

        {metricsMode && <TetrisMetricsPanel source={metricsSource} />}
      </div>

      <p style={{ marginTop: '1rem', color: 'var(--color-text)', opacity: 0.6, fontSize: '0.9rem' }}>
        ← → move · ↓ soft drop · ↑ rotate · Space hard drop · P pause{upgrades.hold && ' · / hold'}
      </p>
      {shopOpen && (
        <ShopPanel open={shopOpen} onClose={() => setShopOpen(false)} coins={coins} upgrades={upgrades} ownedThemeKeys={ownedThemeKeys} busyKey={busyKey} onBuyUpgrade={buyUpgrade} onBuyTheme={buyTheme} />
      )}
    </main>
  )
}
