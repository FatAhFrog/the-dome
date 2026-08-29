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
