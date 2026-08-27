export type ThemeKey = 'dome' | 'sunset_lagoon' | 'neon_arcade' | 'pastel_dream' | 'crimson_void'

export type ThemeDefinition = {
  key: ThemeKey
  label: string
  description: string
  accent: string
  accentSecondary: string
  background: string
  text: string
  onAccent: string
  price: number | null
}

export const THEME_PRICE = 1000

export const THEMES: Record<ThemeKey, ThemeDefinition> = {
  dome: { key: 'dome', label: 'Classic Dome', description: 'The original orange-on-white look.', accent: '#EB4600', accentSecondary: '#FFAE00', background: '#ffffff', text: '#1a1a1a', onAccent: '#ffffff', price: null },
  sunset_lagoon: { key: 'sunset_lagoon', label: 'Sunset Lagoon', description: 'Teal water, warm sand, sunset orange.', accent: '#2A9D8F', accentSecondary: '#E76F51', background: '#FBF7F0', text: '#264653', onAccent: '#ffffff', price: THEME_PRICE },
  neon_arcade: { key: 'neon_arcade', label: 'Neon Arcade', description: 'Blacklight blues and hot magenta.', accent: '#2962FF', accentSecondary: '#FF0059', background: '#0B0B14', text: '#E7E7FB', onAccent: '#ffffff', price: THEME_PRICE },
  pastel_dream: { key: 'pastel_dream', label: 'Pastel Dream', description: 'Soft lavender and cotton-candy pink.', accent: '#D0DBEF', accentSecondary: '#F5CCD4', background: '#FBF9FC', text: '#4A4458', onAccent: '#4A4458', price: THEME_PRICE },
  crimson_void: { key: 'crimson_void', label: 'Crimson Void', description: 'Blood red on near-black.', accent: '#E40B0B', accentSecondary: '#821415', background: '#1F1C1F', text: '#F2DEDE', onAccent: '#ffffff', price: THEME_PRICE },
}

export const PURCHASABLE_THEME_KEYS = (Object.keys(THEMES) as ThemeKey[]).filter((key) => THEMES[key].price !== null)

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return !!value && value in THEMES
}

export function applyThemeVars(themeKey: string | null | undefined) {
  if (typeof document === 'undefined') return
  const theme = THEMES[isThemeKey(themeKey) ? themeKey : 'dome']
  const root = document.documentElement.style
  root.setProperty('--color-accent', theme.accent)
  root.setProperty('--color-accent-secondary', theme.accentSecondary)
  root.setProperty('--color-background', theme.background)
  root.setProperty('--color-text', theme.text)
  root.setProperty('--color-on-accent', theme.onAccent)
}
