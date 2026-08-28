export type ThemeKey = 'dome' | 'sunset_lagoon' | 'neon_arcade' | 'pastel_dream' | 'crimson_void'

export type PieceKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type PieceColors = Record<PieceKey, string>

export type ThemeDefinition = {
  key: ThemeKey
  label: string
  description: string
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

// Fallback used before the DOM/theme has loaded (SSR, first paint, etc).
export const DEFAULT_PIECE_COLORS: PieceColors = {
  I: '#00c2c2', O: '#FFAE00', T: '#a259ff', S: '#3ddc84', Z: '#EB4600', J: '#3b82f6', L: '#ff7a1a',
}

export const THEMES: Record<ThemeKey, ThemeDefinition> = {
  dome: {
    key: 'dome',
    label: 'Classic Dome',
    description: 'The original orange-on-white look.',
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
    background: '#FBF9FC',
    panelBackground: '#F3F0F8',
    text: '#4A4458',
    panelText: '#4A4458',
    border: '#E3DCEE',
    accent: '#D0DBEF',
    accentSecondary: '#F5CCD4',
    onAccent: '#4A4458',
    pieces: { I: '#C9DEF4', O: '#D0DBEF', T: '#D8D8E9', S: '#DFD5E4', Z: '#E6D2DF', J: '#EECFD9', L: '#F5CCD4' },
    price: THEME_PRICE,
  },
  crimson_void: {
    key: 'crimson_void',
    label: 'Red Wunz Go Fasta',
    description: 'A very dark dome soaked in deep reds.',
    background: '#1F1C1F',
    panelBackground: '#40191C',
    text: '#F2DEDE',
    panelText: '#F2DEDE',
    border: '#611618',
    accent: '#E40B0B',
    accentSecondary: '#A21112',
    onAccent: '#ffffff',
    pieces: { I: '#E40B0B', O: '#C30E0E', T: '#A21112', S: '#821415', Z: '#611618', J: '#40191C', L: '#1F1C1F' },
    price: THEME_PRICE,
  },
}

export const PURCHASABLE_THEME_KEYS = (Object.keys(THEMES) as ThemeKey[]).filter((key) => THEMES[key].price !== null)

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return !!value && value in THEMES
}

// Fired on `window` every time applyThemeVars runs, after the CSS custom
// properties have been written to :root. Anything that can't consume CSS
// vars directly (canvas fillStyle, etc.) should listen for this and re-read
// the resolved colors via getPieceColorsFromDOM()/readCssVar().
export const THEME_CHANGE_EVENT = 'dome-theme-change'

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
