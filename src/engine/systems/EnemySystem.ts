import type { IZombie, ZombieKind } from '@/types/game'
import { clamp, distanceSquared } from '@/engine/math'

const MAX_ENEMIES = 320
const WORLD_SIZE = 3600
const WORLD_HEIGHT = 1200
const CELL_SIZE = 52
const GRID_SIZE = Math.ceil(WORLD_SIZE / CELL_SIZE)
const GRID_CELLS = GRID_SIZE * GRID_SIZE

/** Pool plano + spatial hash. No crea objetos durante el tick. */
export class EnemySystem {
  readonly pool: IZombie[]
  private readonly heads = new Int32Array(GRID_CELLS)
  private readonly next = new Int32Array(MAX_ENEMIES)
  private activeCount = 0

  constructor() {
    this.pool = Array.from({ length: MAX_ENEMIES }, (_, id): IZombie => ({
      id, active: false, kind: 'walker', x: 0, y: 0, vx: 0, vy: 0,
      hp: 1, maxHp: 1, speed: 1, radius: 12, hitFlash: 0, knockback: 0, phase: 0,
    }))
    this.heads.fill(-1)
    this.next.fill(-1)
  }

  get count(): number { return this.activeCount }

  reset(): void {
    for (const enemy of this.pool) enemy.active = false
    this.activeCount = 0
  }

  spawn(kind: ZombieKind, wave: number, playerX: number, playerY: number, spawnRadius: number): boolean {
    const enemy = this.pool.find((candidate) => !candidate.active)
    if (!enemy) return false
    const angle = Math.random() * Math.PI * 2
    enemy.active = true
    enemy.kind = kind
    enemy.x = clamp(playerX + Math.cos(angle) * spawnRadius, 12, WORLD_SIZE - 12)
    enemy.y = clamp(playerY + Math.sin(angle) * spawnRadius, 12, WORLD_HEIGHT - 12)
    const baseHp = {walker:40,runner:25,tank:145,armored:110,toxic:65,boss:1600}[kind]
    const growth = Math.pow(wave, 1.1) * (kind === 'tank' ? 9 : 5)
    enemy.hp = baseHp + growth; enemy.maxHp = enemy.hp
    enemy.speed = {walker:36,runner:74,tank:25,armored:31,toxic:34,boss:30}[kind] + Math.min(wave * 1.3, 22)
    enemy.radius = kind === 'boss' ? 27 : kind === 'tank' ? 18 : kind === 'runner' ? 10 : 12
    enemy.vx = 0; enemy.vy = 0; enemy.hitFlash = 0; enemy.knockback = 0; enemy.phase = Math.random() * 7
    this.activeCount += 1
    return true
  }

  update(dt: number, playerX: number, playerY: number, onAttack: (damage: number) => void): void {
    this.rebuildGrid()
    for (const enemy of this.pool) {
      if (!enemy.active) continue
      const dx = playerX - enemy.x
      const dy = playerY - enemy.y
      const distance = Math.hypot(dx, dy) || 1
      let separationX = 0
      let separationY = 0
      const cellX = this.cell(enemy.x)
      const cellY = this.cell(enemy.y)
      for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
        const gx = cellX + ox; const gy = cellY + oy
        if (gx < 0 || gy < 0 || gx >= GRID_SIZE || gy >= GRID_SIZE) continue
        let otherIndex = this.heads[gy * GRID_SIZE + gx] ?? -1
        while (otherIndex !== -1) {
          const other = this.pool[otherIndex]
          if (other?.active && other.id !== enemy.id) {
            const sx = enemy.x - other.x; const sy = enemy.y - other.y
            const sq = sx * sx + sy * sy; const wanted = enemy.radius + other.radius
            if (sq > 0.01 && sq < wanted * wanted) {
              const factor = (wanted - Math.sqrt(sq)) / wanted
              separationX += sx * factor; separationY += sy * factor
            }
          }
          otherIndex = this.next[otherIndex] ?? -1
        }
      }
      const seek = enemy.knockback > 0 ? -0.72 : 1
      const charge = enemy.kind === 'boss' && Math.sin(enemy.phase) > .8 ? 2.5 : 1
      enemy.phase += dt
      enemy.vx = dx / distance * enemy.speed * seek * charge + separationX * 3
      enemy.vy = dy / distance * enemy.speed * seek * charge + separationY * 3
      enemy.x = clamp(enemy.x + enemy.vx * dt, 10, WORLD_SIZE - 10)
      enemy.y = clamp(enemy.y + enemy.vy * dt, 10, WORLD_HEIGHT - 10)
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
      enemy.knockback = Math.max(0, enemy.knockback - dt)
      if (distance < enemy.radius + 7) onAttack(enemy.kind === 'boss' ? 27 : enemy.kind === 'tank' ? 20 : enemy.kind === 'runner' ? 8 : 11)
    }
  }

  nearest(x: number, y: number, maxRange: number): IZombie | null {
    let result: IZombie | null = null
    let best = maxRange * maxRange
    for (const enemy of this.pool) {
      if (!enemy.active) continue
      const sq = distanceSquared(x, y, enemy.x, enemy.y)
      if (sq < best) { best = sq; result = enemy }
    }
    return result
  }

  damage(enemy: IZombie, amount: number): ZombieKind | null {
    if (!enemy.active) return null
    enemy.hp -= amount; enemy.hitFlash = 0.12
    if (enemy.hp > 0) return null
    enemy.active = false; this.activeCount -= 1
    return enemy.kind
  }

  forEachActive(callback: (enemy: IZombie) => void): void {
    for (const enemy of this.pool) if (enemy.active) callback(enemy)
  }

  private rebuildGrid(): void {
    this.heads.fill(-1)
    for (let i = 0; i < this.pool.length; i += 1) {
      const enemy = this.pool[i]
      if (!enemy?.active) continue
      const index = this.cell(enemy.y) * GRID_SIZE + this.cell(enemy.x)
      this.next[i] = this.heads[index] ?? -1
      this.heads[index] = i
    }
  }

  private cell(value: number): number {
    return clamp(Math.floor(value / CELL_SIZE), 0, GRID_SIZE - 1)
  }
}
