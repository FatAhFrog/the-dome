'use client'

import { useState } from 'react'
import { SNAKE_PURCHASABLE_THEME_KEYS, THEMES, SNAKE_THEME_PRICE, ThemeKey } from '@/lib/themes'
import { SNAKE_UPGRADE_PRICES, SnakeUpgrades } from '@/lib/snake/shop'

type Props = {
  open: boolean
  onClose: () => void
  coins: number
  upgrades: SnakeUpgrades
  busyKey: string | null
  onBuyUpgrade: (key: keyof typeof SNAKE_UPGRADE_PRICES) => void
  ownedThemeKeys: string[]
  onBuyTheme: (themeKey: ThemeKey, customName: string) => void
}

export default function SnakeShopPanel({ open, onClose, coins, upgrades, busyKey, onBuyUpgrade, ownedThemeKeys, onBuyTheme }: Props) {
  const [namingTheme, setNamingTheme] = useState<ThemeKey | null>(null)
  const [themeName, setThemeName] = useState('')

  const startNaming = (key: ThemeKey) => {
    setNamingTheme(key)
    setThemeName(THEMES[key].label)
  }

  const confirmThemePurchase = () => {
    if (!namingTheme) return
    onBuyTheme(namingTheme, themeName.trim() || THEMES[namingTheme].label)
    setNamingTheme(null)
    setThemeName('')
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s ease', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(360px, 100vw)', background: 'var(--color-background, #fff)', color: 'var(--color-text, #1a1a1a)', borderLeft: '2px solid var(--color-border)', boxShadow: '-6px 0 20px rgba(0,0,0,0.25)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', zIndex: 1001, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-background, #fff)', zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-accent)' }}>Shop</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>Coins: {coins.toLocaleString()}</p>
          </div>
          <button onClick={onClose} aria-label="Close shop" style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text)' }}>X</button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>Collect coins in Snake and spend them here.</p>

          <ShopItem title={`More Apples (Lv. ${upgrades.extraApples})`} description="Adds one more apple that can spawn each round." price={SNAKE_UPGRADE_PRICES.extraApples} owned={false} disabled={coins < SNAKE_UPGRADE_PRICES.extraApples} busy={busyKey === 'extraApples'} onBuy={() => onBuyUpgrade('extraApples')} buyLabel="Buy" />
          <ShopItem title="Slow Down" description="Hold Space to slow time for 5 seconds. Recharges 1 second per apple." price={SNAKE_UPGRADE_PRICES.slowDown} owned={upgrades.slowDown} disabled={coins < SNAKE_UPGRADE_PRICES.slowDown} busy={busyKey === 'slowDown'} onBuy={() => onBuyUpgrade('slowDown')} />
          <ShopItem title="Shield" description="Gives an extra life. It is shown just above the control bar while active." price={SNAKE_UPGRADE_PRICES.shield} owned={upgrades.shield} disabled={coins < SNAKE_UPGRADE_PRICES.shield} busy={busyKey === 'shield'} onBuy={() => onBuyUpgrade('shield')} />

          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>Dome Themes</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>Buying a theme re-skins the whole Dome, not just Snake. Pick which one is active from your Profile.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SNAKE_PURCHASABLE_THEME_KEYS.map((key) => {
                const theme = THEMES[key]
                const owned = ownedThemeKeys.includes(key)
                return (
                  <div key={key} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} />
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.accentSecondary, display: 'inline-block' }} />
                      <strong style={{ fontSize: '0.9rem' }}>{theme.label}</strong>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{theme.description}</p>
                    {owned ? <span style={{ fontSize: '0.8rem', color: '#3ddc84', fontWeight: 600 }}>Owned</span> : namingTheme === key ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input value={themeName} onChange={(e) => setThemeName(e.target.value)} maxLength={30} placeholder="Name this theme" style={{ flex: 1, padding: '0.35rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.85rem' }} />
                        <button onClick={confirmThemePurchase} disabled={busyKey === `theme:${key}`} style={{ padding: '0.35rem 0.6rem', background: 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Confirm</button>
                      </div>
                    ) : (
                      <button onClick={() => startNaming(key)} disabled={coins < SNAKE_THEME_PRICE} style={{ padding: '0.35rem 0.75rem', background: coins < SNAKE_THEME_PRICE ? 'var(--color-border)' : 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: coins < SNAKE_THEME_PRICE ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>Buy - Coins {SNAKE_THEME_PRICE.toLocaleString()}</button>
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

function ShopItem({ title, description, price, owned, disabled, busy, onBuy, buyLabel = 'Buy' }: { title: string; description: string; price: number; owned: boolean; disabled: boolean; busy: boolean; onBuy: () => void; buyLabel?: string }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.75rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
      <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{description}</p>
      {owned ? <span style={{ fontSize: '0.8rem', color: '#3ddc84', fontWeight: 600 }}>Owned</span> : (
        <button onClick={onBuy} disabled={disabled || busy} style={{ padding: '0.35rem 0.75rem', background: disabled || busy ? 'var(--color-border)' : 'var(--color-accent)', color: 'var(--color-on-accent)', border: 'none', borderRadius: '6px', cursor: disabled || busy ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
          {busy ? 'Buying...' : `${buyLabel} - Coins ${price.toLocaleString()}`}
        </button>
      )}
    </div>
  )
}
