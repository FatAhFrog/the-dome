'use client'

import { useState } from 'react'
import { PURCHASABLE_THEME_KEYS, THEMES, THEME_PRICE, ThemeKey } from '@/lib/themes'

export type TetrisUpgrades = {
  lowSpawn: boolean
  speedLevel: number
  ghost: boolean
  hold: boolean
}

export const UPGRADE_PRICES = {
  lowSpawn: 300,
  ghost: 900,
  hold: 500,
}

export const MAX_SPEED_LEVEL = 10
export const speedLevelPrice = (currentLevel: number) => 150 * (currentLevel + 1)

type Props = {
  open: boolean
  onClose: () => void
  coins: number
  upgrades: TetrisUpgrades
  ownedThemeKeys: string[]
  busyKey: string | null
  onBuyUpgrade: (key: 'lowSpawn' | 'speed' | 'ghost' | 'hold') => void
  onBuyTheme: (themeKey: ThemeKey, customName: string) => void
}

export default function ShopPanel({
  open,
  onClose,
  coins,
  upgrades,
  ownedThemeKeys,
  busyKey,
  onBuyUpgrade,
  onBuyTheme,
}: Props) {
  const [namingTheme, setNamingTheme] = useState<ThemeKey | null>(null)
  const [themeName, setThemeName] = useState('')

  const speedPrice = speedLevelPrice(upgrades.speedLevel)
  const speedMaxed = upgrades.speedLevel >= MAX_SPEED_LEVEL

  const startNaming = (key: ThemeKey) => {
    setNamingTheme(key)
    setThemeName(THEMES[key].label)
  }

  const confirmThemePurchase = () => {
    if (!namingTheme) return
    const name = themeName.trim() || THEMES[namingTheme].label
    onBuyTheme(namingTheme, name)
    setNamingTheme(null)
    setThemeName('')
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(360px, 100vw)',
          background: 'var(--color-background, #fff)',
          color: 'var(--color-text, #1a1a1a)',
          borderLeft: '2px solid #1A1A1A',
          boxShadow: '-6px 0 20px rgba(0,0,0,0.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-background, #fff)', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-accent)' }}>Shop</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#999' }}>Coins: {coins.toLocaleString()}</p>
          </div>
          <button onClick={onClose} aria-label="Close shop" style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}>X</button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>Earn 1 coin per line you clear. Spend them here.</p>
          <ShopItem title="Quick Spawn" description="New pieces appear 2 rows lower instead of above the board - react faster." price={UPGRADE_PRICES.lowSpawn} owned={upgrades.lowSpawn} disabled={coins < UPGRADE_PRICES.lowSpawn} busy={busyKey === 'lowSpawn'} onBuy={() => onBuyUpgrade('lowSpawn')} />
          <ShopItem title={`Tempo Control ${upgrades.speedLevel > 0 ? `(Lv. ${upgrades.speedLevel})` : ''}`} description="Softens how fast drop speed ramps up at high levels - stack it for higher scores in the late game." price={speedMaxed ? null : speedPrice} owned={false} maxed={speedMaxed} disabled={speedMaxed || coins < speedPrice} busy={busyKey === 'speed'} onBuy={() => onBuyUpgrade('speed')} buyLabel={upgrades.speedLevel > 0 ? 'Upgrade again' : 'Buy'} />
          <ShopItem title="Hologram Piece" description="Shows a translucent outline of where your piece will land if hard-dropped." price={UPGRADE_PRICES.ghost} owned={upgrades.ghost} disabled={coins < UPGRADE_PRICES.ghost} busy={busyKey === 'ghost'} onBuy={() => onBuyUpgrade('ghost')} />
          <ShopItem title="Hold Piece" description={'Store the active piece and swap it back in later. Press "/" to hold/swap.'} price={UPGRADE_PRICES.hold} owned={upgrades.hold} disabled={coins < UPGRADE_PRICES.hold} busy={busyKey === 'hold'} onBuy={() => onBuyUpgrade('hold')} />

          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Dome Themes</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#999' }}>Buying a theme re-skins the whole Dome, not just Tetris. Pick which one is active from your Profile.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PURCHASABLE_THEME_KEYS.map((key) => {
                const theme = THEMES[key]
                const owned = ownedThemeKeys.includes(key)
                return (
                  <div key={key} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} />
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.accentSecondary, display: 'inline-block' }} />
                      <strong style={{ fontSize: '0.9rem' }}>{theme.label}</strong>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#999' }}>{theme.description}</p>
                    {owned ? <span style={{ fontSize: '0.8rem', color: '#3ddc84', fontWeight: 600 }}>Owned</span> : namingTheme === key ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input value={themeName} onChange={(e) => setThemeName(e.target.value)} maxLength={30} placeholder="Name this theme" style={{ flex: 1, padding: '0.35rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '0.85rem' }} />
                        <button onClick={confirmThemePurchase} disabled={busyKey === `theme:${key}`} style={{ padding: '0.35rem 0.6rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Confirm</button>
                      </div>
                    ) : (
                      <button onClick={() => startNaming(key)} disabled={coins < THEME_PRICE} style={{ padding: '0.35rem 0.75rem', background: coins < THEME_PRICE ? '#ccc' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: coins < THEME_PRICE ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Buy - Coins {THEME_PRICE.toLocaleString()}</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ShopItem({ title, description, price, owned, maxed, disabled, busy, onBuy, buyLabel = 'Buy' }: {
  title: string
  description: string
  price: number | null
  owned: boolean
  maxed?: boolean
  disabled: boolean
  busy: boolean
  onBuy: () => void
  buyLabel?: string
}) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '0.75rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
      <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: '#999' }}>{description}</p>
      {owned ? <span style={{ fontSize: '0.8rem', color: '#3ddc84', fontWeight: 600 }}>Owned</span> : maxed ? <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 600 }}>Maxed out</span> : (
        <button onClick={onBuy} disabled={disabled || busy} style={{ padding: '0.35rem 0.75rem', background: disabled || busy ? '#ccc' : 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: disabled || busy ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
          {busy ? 'Buying...' : `${buyLabel} - Coins ${price?.toLocaleString()}`}
        </button>
      )}
    </div>
  )
}
