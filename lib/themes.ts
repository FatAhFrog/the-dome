export type ThemeKey = 'dome' | 'sunset_lagoon' | 'neon_arcade' | 'pastel_dream' | 'crimson_void' | 'graphite_glow' | 'purple_burst' | 'mint_wave' | 'retro_game'

export type PieceKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type PieceColors = Record<PieceKey, string>

export type ThemeDefinition = {
  key: ThemeKey
  label: string
  description: string
  shop: 'both' | 'tetris' | 'snake'
  // Page-level surface + text
  background: string
  panelBackground: string
  text: string
  panelText: string
  border: string
  // Brand / interactive
  accent: string
  accentSecondary: string
  onAccent: string
  // The 7 tetromino colors. Every other color in the theme is chosen to
  // work *with* this set, per the "bricks are the source of truth" rule.
  pieces: PieceColors
  price: number | null
}

export const THEME_PRICE = 1000
export const SNAKE_THEME_PRICE = 500

// Fallback used before the DOM/theme has loaded (SSR, first paint, etc).
export const DEFAULT_PIECE_COLORS: PieceColors = {
  I: '#00c2c2', O: '#FFAE00', T: '#a259ff', S: '#3ddc84', Z: '#EB4600', J: '#3b82f6', L: '#ff7a1a',
}

export const THEMES: Record<ThemeKey, ThemeDefinition> = {
  dome: {
    key: 'dome',
    label: 'Classic Dome',
    description: 'The original orange-on-white look.',
    shop: 'both',
    background: '#ffffff',
    panelBackground: '#f7f7f7',
    text: '#1a1a1a',
    panelText: '#1a1a1a',
    border: '#eeeeee',
    accent: '#EB4600',
    accentSecondary: '#FFAE00',
    onAccent: '#ffffff',
    pieces: DEFAULT_PIECE_COLORS,
    price: null,
  },
  sunset_lagoon: {
    key: 'sunset_lagoon',
    label: 'Sunset Smooth',
    description: 'A soft, warm sunset gradient from red to teal-blue dusk.',
    shop: 'tetris',
    background: '#FFF8F0',
    panelBackground: '#FFF1DE',
    text: '#264653',
    panelText: '#264653',
    border: '#E8D9C5',
    accent: '#F3722C',
    accentSecondary: '#577590',
    onAccent: '#ffffff',
    pieces: { I: '#F94144', O: '#F3722C', T: '#F8961E', S: '#F9C74F', Z: '#90BE6D', J: '#43AA8B', L: '#577590' },
    price: THEME_PRICE,
  },
  neon_arcade: {
    key: 'neon_arcade',
    label: 'Neon Glow',
    description: 'Retro-arcade blacklight blues, magenta and cyberpunk neon.',
    shop: 'tetris',
    background: '#0B0B14',
    panelBackground: '#14142A',
    text: '#E7E7FB',
    panelText: '#E7E7FB',
    border: '#2A2A45',
    accent: '#2962FF',
    accentSecondary: '#FF0059',
    onAccent: '#ffffff',
    pieces: { I: '#0AD2FF', O: '#2962FF', T: '#9500FF', S: '#FF0059', Z: '#FF8C00', J: '#B4E600', L: '#0FFFDB' },
    price: THEME_PRICE,
  },
  pastel_dream: {
    key: 'pastel_dream',
    label: 'Aether',
    description: 'Airy, glass-like pastels — soft lavender-blue into cotton-candy pink.',
    shop: 'tetris',
    background: '#FBF9FC',
    panelBackground: '#F3F0F8',
    text: '#4A4458',
    panelText: '#4A4458',
    border: '#C8BCE2',
    accent: '#8FB3E8',
    accentSecondary: '#F29AAF',
    onAccent: '#4A4458',
    pieces: { I: '#8FC3F0', O: '#9CB9F2', T: '#B3A9E5', S: '#C7A3D1', Z: '#D99ABF', J: '#E89AAE', L: '#F2A0B0' },
    price: THEME_PRICE,
  },
  crimson_void: {
    key: 'crimson_void',
    label: 'Red Wunz Go Fasta',
    description: 'A very dark dome soaked in deep reds.',
    shop: 'tetris',
    background: '#1F1C1F',
    panelBackground: '#2B1012',
    text: '#F2DEDE',
    panelText: '#F2DEDE',
    border: '#611618',
    accent: '#E40B0B',
    accentSecondary: '#A21112',
    onAccent: '#ffffff',
    pieces: { I: '#FF3333', O: '#FF6666', T: '#ED1C24', S: '#D9272E', Z: '#FF1A2A', J: '#B51F2A', L: '#FF4B4B' },
    price: THEME_PRICE,
  },
  graphite_glow: {
    key: 'graphite_glow',
    label: 'BumbleBee',
    description: 'Cold gray, mustard yellow, and black contrast for a sharper arcade look.',
    shop: 'snake',
    background: '#000000',
    panelBackground: '#202020',
    text: '#ffffff',
    panelText: '#ffffff',
    border: '#4d4d4d',
    accent: '#ffd100',
    accentSecondary: '#000000',
    onAccent: '#000000',
    pieces: { I: '#eeeeee', O: '#ffe032', T: '#ffd100', S: '#333533', Z: '#4d4d4d', J: '#ffffff', L: '#bdbdbd' },
    price: THEME_PRICE,
  },
  purple_burst: {
    key: 'purple_burst',
    label: 'Purple Burst',
    description: 'Deep plum, punchy pink, gold, teal, and green with high-energy arcade contrast.',
    shop: 'snake',
    background: '#350542',
    panelBackground: '#46085a',
    text: '#f8f4ff',
    panelText: '#f8f4ff',
    border: '#7d2f87',
    accent: '#ee4266',
    accentSecondary: '#ffd23f',
    onAccent: '#ffffff',
    pieces: { I: '#8f5bb7', O: '#ee4266', T: '#ffd23f', S: '#3bceac', Z: '#0ead69', J: '#6c3ea1', L: '#b33b7a' },
    price: THEME_PRICE,
  },
  mint_wave: {
    key: 'mint_wave',
    label: 'Mint Wave',
    description: 'Oceanic blue gradients with mint and lime that feel calm but bright.',
    shop: 'snake',
    background: '#1f5f89',
    panelBackground: '#22577a',
    text: '#eefaf7',
    panelText: '#eefaf7',
    border: '#3d8e9a',
    accent: '#38a3a5',
    accentSecondary: '#57cc99',
    onAccent: '#062e2f',
    pieces: { I: '#9be564', O: '#38a3a5', T: '#57cc99', S: '#80ed99', Z: '#c7f9cc', J: '#1d4f69', L: '#7ae3d1' },
    price: THEME_PRICE,
  },
  retro_game: {
    key: 'retro_game',
    label: 'Retro-Game',
    description: 'A bright handheld-inspired palette of vivid blue, teal, and electric green.',
    shop: 'snake',
    background: '#f2fff8',
    panelBackground: '#d8f7e4',
    text: '#020969',
    panelText: '#020969',
    border: '#74cfa8',
    accent: '#0b9f68',
    accentSecondary: '#1672dc',
    onAccent: '#ffffff',
    pieces: { I: '#2439d1', O: '#1672dc', T: '#0f9ab0', S: '#12b887', Z: '#18d486', J: '#2bea94', L: '#4cff9a' },
    price: SNAKE_THEME_PRICE,
  },
}

export const PURCHASABLE_THEME_KEYS = (Object.keys(THEMES) as ThemeKey[]).filter((key) => THEMES[key].price !== null)
export const TETRIS_PURCHASABLE_THEME_KEYS = (Object.keys(THEMES) as ThemeKey[]).filter((key) => THEMES[key].price !== null && THEMES[key].shop !== 'snake')
export const SNAKE_PURCHASABLE_THEME_KEYS = (Object.keys(THEMES) as ThemeKey[]).filter((key) => THEMES[key].price !== null && THEMES[key].shop !== 'tetris')

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return !!value && value in THEMES
}

// Fired on `window` every time applyThemeVars runs, after the CSS custom
// properties have been written to :root. Anything that can't consume CSS
// vars directly (canvas fillStyle, etc.) should listen for this and re-read
// the resolved colors via getPieceColorsFromDOM()/readCssVar().
export const THEME_CHANGE_EVENT = 'dome-theme-change'

/** `:root` custom properties for SSR so first HTML already has the active theme. */
export function themeCssText(themeKey: string | null | undefined): string {
  const theme = THEMES[isThemeKey(themeKey) ? themeKey : 'dome']
  return `:root{--color-background:${theme.background};--color-panel-background:${theme.panelBackground};--color-text:${theme.text};--color-panel-text:${theme.panelText};--color-muted:color-mix(in srgb,${theme.text} 58%,transparent);--color-border:${theme.border};--color-accent:${theme.accent};--color-accent-secondary:${theme.accentSecondary};--color-on-accent:${theme.onAccent};--piece-i:${theme.pieces.I};--piece-o:${theme.pieces.O};--piece-t:${theme.pieces.T};--piece-s:${theme.pieces.S};--piece-z:${theme.pieces.Z};--piece-j:${theme.pieces.J};--piece-l:${theme.pieces.L}}`
}

export function applyThemeVars(themeKey: string | null | undefined) {
  if (typeof document === 'undefined') return
  const theme = THEMES[isThemeKey(themeKey) ? themeKey : 'dome']
  const root = document.documentElement.style

  root.setProperty('--color-background', theme.background)
  root.setProperty('--color-panel-background', theme.panelBackground)
  root.setProperty('--color-text', theme.text)
  root.setProperty('--color-panel-text', theme.panelText)
  root.setProperty('--color-border', theme.border)
  root.setProperty('--color-accent', theme.accent)
  root.setProperty('--color-accent-secondary', theme.accentSecondary)
  root.setProperty('--color-on-accent', theme.onAccent)
  root.setProperty('--color-muted', `color-mix(in srgb, ${theme.text} 58%, transparent)`)

  root.setProperty('--piece-i', theme.pieces.I)
  root.setProperty('--piece-o', theme.pieces.O)
  root.setProperty('--piece-t', theme.pieces.T)
  root.setProperty('--piece-s', theme.pieces.S)
  root.setProperty('--piece-z', theme.pieces.Z)
  root.setProperty('--piece-j', theme.pieces.J)
  root.setProperty('--piece-l', theme.pieces.L)

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { themeKey: theme.key } }))
}

// Reads a single CSS custom property off <html>, already resolved to a real
// color value the Canvas 2D API can use for fillStyle (unlike `var(--x)`,
// which Canvas does not understand).
export function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

// Convenience wrapper for the 7 tetromino colors specifically — this is
// what TetrisPage should call on mount and on THEME_CHANGE_EVENT.
export function getPieceColorsFromDOM(): PieceColors {
  return {
    I: readCssVar('--piece-i', DEFAULT_PIECE_COLORS.I),
    O: readCssVar('--piece-o', DEFAULT_PIECE_COLORS.O),
    T: readCssVar('--piece-t', DEFAULT_PIECE_COLORS.T),
    S: readCssVar('--piece-s', DEFAULT_PIECE_COLORS.S),
    Z: readCssVar('--piece-z', DEFAULT_PIECE_COLORS.Z),
    J: readCssVar('--piece-j', DEFAULT_PIECE_COLORS.J),
    L: readCssVar('--piece-l', DEFAULT_PIECE_COLORS.L),
  }
}
