export type SnakeUpgrades = {
  extraApples: number
  slowDown: boolean
  shield: boolean
}

export const SNAKE_UPGRADE_PRICES = {
  extraApples: 125,
  slowDown: 350,
  shield: 200,
} as const

export type SnakeThemeKey = 'sunny_circuit' | 'berry_pop' | 'mint_machine'

type SnakeTheme = {
  key: SnakeThemeKey
  label: string
  description: string
  colors: [string, string, string, string, string]
  price: number
}

export const SNAKE_THEMES: Record<SnakeThemeKey, SnakeTheme> = {
  sunny_circuit: {
    key: 'sunny_circuit',
    label: 'Sunny Circuit',
    description: 'Electric yellow, graphite, and warm gray.',
    colors: ['#D6D6D6', '#FFEE32', '#FFD100', '#202020', '#333533'],
    price: 500,
  },
  berry_pop: {
    key: 'berry_pop',
    label: 'Berry Pop',
    description: 'Punchy berry, coral, gold, aqua, and green.',
    colors: ['#540D6E', '#EE4266', '#FFD23F', '#3BCEAC', '#0EAD69'],
    price: 500,
  },
  mint_machine: {
    key: 'mint_machine',
    label: 'Mint Machine',
    description: 'Deep blue through cool mint and fresh green.',
    colors: ['#22577A', '#38A3A5', '#57CC99', '#80ED99', '#C7F9CC'],
    price: 500,
  },
}

export const SNAKE_THEME_KEYS = Object.keys(SNAKE_THEMES) as SnakeThemeKey[]
