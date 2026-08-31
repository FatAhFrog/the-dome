'use client'

import { useState } from 'react'
import { SNAKE_THEMES, SNAKE_THEME_KEYS, SNAKE_UPGRADE_PRICES, SnakeThemeKey, SnakeUpgrades } from '@/lib/snake/shop'

type Props = {
  open: boolean
  onClose: () => void
  coins: number
  upgrades: SnakeUpgrades
  ownedThemeKeys: string[]
  activeThemeKey: SnakeThemeKey | null
  busyKey: string | null
  onBuyUpgrade: (key: keyof typeof SNAKE_UPGRADE_PRICES) => void
  onBuyTheme: (themeKey: SnakeThemeKey, customName: string) => void
  onSelectTheme: (themeKey: SnakeThemeKey | null) => void
}

export default function SnakeShopPanel({ open, onClose, coins, upgrades, ownedThemeKeys, activeThemeKey, busyKey, onBuyUpgrade, onBuyTheme, onSelectTheme }: Props) {
  const [namingTheme, setNamingTheme] = useState<SnakeThemeKey | null>(null)
  const [themeName, setThemeName] = useState('')

  const confirmThemePurchase = () => {
    if (!namingTheme) return
    onBuyTheme(namingTheme, themeName.trim() || SNAKE_THEMES[namingTheme].label)
    setNamingTheme(null)
    setThemeName('')
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s ease', zIndex: 1000 }} />
      <aside style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(380px, 100vw)', background: 'var(--color-background)', color: 'var(--color-text)', borderLeft: '2px solid var(--color-border)', boxShadow: '-6px 0 20px rgba(0,0,0,0.25)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', zIndex: 1001, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-background)', zIndex: 1 }}>
          <div><h2 style={{ margin: 0, color: 'var(--color-accent)' }}>Snake Shop</h2><p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>Coins: {coins.toLocaleString()}</p></div>
          <button onClick={onClose} aria-label="Close shop" style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', width: 32, height: 32, cursor: 'pointer', color: 'var(--color-text)' }}>X</button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>Earn coins by collecting the occasional coin apple. Snake upgrades and palettes stay exclusive to this shop.</p>
          <ShopItem title={`More Apples (Lv. ${upgrades.extraApples})`} description="Adds one more apple to the board each game. Multiple apples mean more chances to grow and score." price={SNAKE_UPGRADE_PRICES.extraApples} owned={false} disabled={coins < SNAKE_UPGRADE_PRICES.extraApples} busy={busyKey === 'extraApples'} onBuy={() => onBuyUpgrade('extraApples')} buyLabel="Buy level" />
          <ShopItem title="Slow Down" description="Hold Space during a run to slow the snake. It has 5 seconds of charge and recharges 1 second for every apple collected." price={SNAKE_UPGRADE_PRICES.slowDown} owned={upgrades.slowDown} disabled={coins < SNAKE_UPGRADE_PRICES.slowDown} busy={busyKey === 'slowDown'} onBuy={() => onBuyUpgrade('slowDown')} />
          <ShopItem title="Shield" description="Absorbs one collision and gives the snake an extra life. The shield is shown beside the game panel." price={SNAKE_UPGRADE_PRICES.shield} owned={upgrades.shield} disabled={coins < SNAKE_UPGRADE_PRICES.shield} busy={busyKey === 'shield'} onBuy={() => onBuyUpgrade('shield')} />

          <div>
            <h3 style={{ margin: '0 0 0.25rem' }}>Snake Palettes</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>These palettes apply to Snake only and never change the Dome theme.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => onSelectTheme(null)} style={{ padding: '0.5rem', textAlign: 'left', border: `1px solid ${activeThemeKey === null ? 'var(--color-accent)' : 'var(--color-border)'}`, background: 'transparent', color: 'var(--color-text)', borderRadius: '6px', cursor: 'pointer' }}>Classic Snake {activeThemeKey === null && '✓'}</button>
              {SNAKE_THEME_KEYS.map((key) => {
                const theme = SNAKE_THEMES[key]
                const owned = ownedThemeKeys.includes(key)
                return <div key={key} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: '0.45rem' }}>{theme.colors.map((color) => <span key={color} style={{ background: color, width: 25, height: 25, display: 'inline-block' }} />)}</div>
                  <strong>{theme.label}</strong>
                  <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{theme.description}</p>
                  {owned ? <button onClick={() => onSelectTheme(activeThemeKey === key ? null : key)} style={{ padding: '0.35rem 0.75rem', background: activeThemeKey === key ? 'var(--color-border)' : 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>{activeThemeKey === key ? 'Using palette' : 'Use palette'}</button> : namingTheme === key ? <div style={{ display: 'flex', gap: '0.4rem' }}><input value={themeName} onChange={(e) => setThemeName(e.target.value)} maxLength={30} style={{ flex: 1, padding: '0.35rem' }} /><button onClick={confirmThemePurchase} disabled={busyKey === `theme:${key}`} style={{ padding: '0.35rem 0.6rem' }}>Confirm</button></div> : <button onClick={() => { setNamingTheme(key); setThemeName(theme.label) }} disabled={coins < theme.price} style={{ padding: '0.35rem 0.75rem', background: coins < theme.price ? 'var(--color-border)' : 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: coins < theme.price ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Buy - Coins {theme.price}</button>}
                </div>
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function ShopItem({ title, description, price, owned, disabled, busy, onBuy, buyLabel = 'Buy' }: { title: string; description: string; price: number; owned: boolean; disabled: boolean; busy: boolean; onBuy: () => void; buyLabel?: string }) {
  return <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}><strong>{title}</strong><p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{description}</p>{owned ? <span style={{ fontSize: '0.8rem', color: '#3ddc84', fontWeight: 600 }}>Owned</span> : <button onClick={onBuy} disabled={disabled || busy} style={{ padding: '0.35rem 0.75rem', background: disabled || busy ? 'var(--color-border)' : 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: disabled || busy ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>{busy ? 'Buying...' : `${buyLabel} - Coins ${price.toLocaleString()}`}</button>}</div>
}
