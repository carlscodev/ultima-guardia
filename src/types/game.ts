export type ZombieKind = 'walker' | 'runner' | 'tank'
export type WeaponKind = 'rifle' | 'shotgun'
export type UpgradeId = 'fireRate' | 'damage' | 'speed' | 'pulse' | 'armor' | 'range'
export type ScreenState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover'

export interface Vec2 { x: number; y: number }

export interface IPlayer {
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  damage: number
  fireInterval: number
  range: number
  invulnerability: number
  angle: number
  xp: number
  level: number
  xpNeeded: number
  pulsePower: number
  weapon: WeaponKind
}

export interface IZombie {
  readonly id: number
  active: boolean
  kind: ZombieKind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  speed: number
  radius: number
  hitFlash: number
  knockback: number
  phase: number
}

export interface IWeapon {
  readonly kind: WeaponKind
  readonly title: string
  pellets: number
  spread: number
  projectileSpeed: number
  recoil: number
  damageMultiplier: number
  intervalMultiplier: number
}

export interface IUpgrade {
  readonly id: UpgradeId
  readonly name: string
  readonly description: string
  readonly icon: string
}

export interface GameState {
  screen: ScreenState
  hp: number
  maxHp: number
  xp: number
  xpNeeded: number
  level: number
  wave: number
  kills: number
  elapsed: number
  pulseCooldown: number
  weapon: WeaponKind
  enemies: number
  fps: number
}

export interface InputState {
  moveX: number
  moveY: number
  pulseQueued: boolean
  weaponQueued: WeaponKind | null
}

export interface EngineEvents {
  onHud: (state: Readonly<GameState>) => void
  onScreen: (screen: ScreenState) => void
  onUpgrades: (upgrades: readonly IUpgrade[]) => void
}

export interface DebugTelemetry {
  fps: number
  frameMs: number
  enemies: number
  renderScale: number
  mode: 'canvas2d'
  elapsed: number
  screen: ScreenState
  playerX: number
  playerY: number
  kills: number
  wave: number
  level: number
  hp: number
  pulseCooldown: number
  weapon: WeaponKind
}

declare global {
  interface Window { __UG_DEBUG__?: DebugTelemetry }
}
