import * as THREE from 'three'
import type { IZombie, ZombieKind } from '@/types/game'
import { clamp, distanceSquared, randomRange } from '@/engine/math'

const MAX_ENEMIES = 420
const WORLD_HALF = 45
const CELL_SIZE = 5
const GRID_SIZE = 18
const GRID_CELLS = GRID_SIZE * GRID_SIZE

export class EnemySystem {
  readonly mesh: THREE.InstancedMesh
  private readonly pool: IZombie[]
  private readonly matrix = new THREE.Matrix4()
  private readonly position = new THREE.Vector3()
  private readonly scale = new THREE.Vector3()
  private readonly quaternion = new THREE.Quaternion()
  private readonly color = new THREE.Color()
  private readonly heads = new Int32Array(GRID_CELLS)
  private readonly next = new Int32Array(MAX_ENEMIES)
  private activeCount = 0

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.CapsuleGeometry(0.48, 1.05, 4, 8)
    geometry.translate(0, 1.02, 0)
    const material = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.03 })
    this.mesh = new THREE.InstancedMesh(geometry, material, MAX_ENEMIES)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.mesh.count = 0
    scene.add(this.mesh)
    this.pool = Array.from({ length: MAX_ENEMIES }, (_, id): IZombie => ({
      id, active: false, kind: 'walker', x: 0, z: 0, vx: 0, vz: 0,
      hp: 1, maxHp: 1, speed: 1, radius: 0.65, hitFlash: 0, knockback: 0, phase: 0,
    }))
    this.heads.fill(-1)
    this.next.fill(-1)
  }

  get count(): number { return this.activeCount }

  reset(): void {
    for (const enemy of this.pool) enemy.active = false
    this.activeCount = 0
    this.mesh.count = 0
  }

  spawn(kind: ZombieKind, wave: number, playerX: number, playerZ: number): boolean {
    const enemy = this.pool.find((candidate) => !candidate.active)
    if (!enemy) return false
    const angle = Math.random() * Math.PI * 2
    const radius = randomRange(27, 35)
    enemy.active = true
    enemy.kind = kind
    enemy.x = clamp(playerX + Math.cos(angle) * radius, -WORLD_HALF, WORLD_HALF)
    enemy.z = clamp(playerZ + Math.sin(angle) * radius, -WORLD_HALF, WORLD_HALF)
    const baseHp = kind === 'tank' ? 125 : kind === 'runner' ? 30 : 48
    const growth = Math.pow(wave, 1.16) * (kind === 'tank' ? 11 : 5)
    enemy.hp = baseHp + growth
    enemy.maxHp = enemy.hp
    enemy.speed = kind === 'tank' ? 2.1 + Math.min(wave * 0.05, 1) : kind === 'runner' ? 5.9 + Math.min(wave * 0.08, 1.8) : 3.25 + Math.min(wave * 0.07, 1.6)
    enemy.radius = kind === 'tank' ? 1.05 : kind === 'runner' ? 0.52 : 0.68
    enemy.vx = 0; enemy.vz = 0; enemy.hitFlash = 0; enemy.knockback = 0; enemy.phase = Math.random() * Math.PI * 2
    this.activeCount += 1
    return true
  }

  update(dt: number, playerX: number, playerZ: number, elapsed: number, onAttack: (damage: number) => void): void {
    this.rebuildGrid()
    let instance = 0
    for (let index = 0; index < this.pool.length; index += 1) {
      const enemy = this.pool[index]
      if (!enemy?.active) continue
      const dx = playerX - enemy.x
      const dz = playerZ - enemy.z
      const distance = Math.hypot(dx, dz) || 0.001
      let separationX = 0
      let separationZ = 0
      const cellX = this.cellCoordinate(enemy.x)
      const cellZ = this.cellCoordinate(enemy.z)
      for (let oz = -1; oz <= 1; oz += 1) for (let ox = -1; ox <= 1; ox += 1) {
        const gx = cellX + ox
        const gz = cellZ + oz
        if (gx < 0 || gz < 0 || gx >= GRID_SIZE || gz >= GRID_SIZE) continue
        let otherIndex = this.heads[gz * GRID_SIZE + gx] ?? -1
        while (otherIndex !== -1) {
          const other = this.pool[otherIndex]
          if (other?.active && other.id !== enemy.id) {
            const sx = enemy.x - other.x
            const sz = enemy.z - other.z
            const sq = sx * sx + sz * sz
            const wanted = enemy.radius + other.radius
            if (sq > 0.0001 && sq < wanted * wanted) {
              const strength = (wanted - Math.sqrt(sq)) / wanted
              separationX += sx * strength
              separationZ += sz * strength
            }
          }
          otherIndex = this.next[otherIndex] ?? -1
        }
      }
      const seek = enemy.knockback > 0 ? -1.8 : 1
      enemy.vx = (dx / distance) * enemy.speed * seek + separationX * 4.4
      enemy.vz = (dz / distance) * enemy.speed * seek + separationZ * 4.4
      enemy.x = clamp(enemy.x + enemy.vx * dt, -WORLD_HALF, WORLD_HALF)
      enemy.z = clamp(enemy.z + enemy.vz * dt, -WORLD_HALF, WORLD_HALF)
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
      enemy.knockback = Math.max(0, enemy.knockback - dt)
      if (distance < enemy.radius + 0.62) onAttack(enemy.kind === 'tank' ? 22 : enemy.kind === 'runner' ? 8 : 11)
      this.writeInstance(enemy, instance, elapsed)
      instance += 1
    }
    this.mesh.count = instance
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  nearest(x: number, z: number, maxRange: number): IZombie | null {
    let result: IZombie | null = null
    let best = maxRange * maxRange
    for (const enemy of this.pool) {
      if (!enemy.active) continue
      const sq = distanceSquared(x, z, enemy.x, enemy.z)
      if (sq < best) { best = sq; result = enemy }
    }
    return result
  }

  forEachActive(callback: (enemy: IZombie) => void): void {
    for (const enemy of this.pool) if (enemy.active) callback(enemy)
  }

  damage(enemy: IZombie, amount: number): ZombieKind | null {
    if (!enemy.active) return null
    enemy.hp -= amount
    enemy.hitFlash = 0.1
    if (enemy.hp > 0) return null
    enemy.active = false
    this.activeCount -= 1
    return enemy.kind
  }

  private rebuildGrid(): void {
    this.heads.fill(-1)
    for (let i = 0; i < this.pool.length; i += 1) {
      const enemy = this.pool[i]
      if (!enemy?.active) continue
      const cell = this.cellCoordinate(enemy.z) * GRID_SIZE + this.cellCoordinate(enemy.x)
      this.next[i] = this.heads[cell] ?? -1
      this.heads[cell] = i
    }
  }

  private cellCoordinate(value: number): number {
    return clamp(Math.floor((value + WORLD_HALF) / CELL_SIZE), 0, GRID_SIZE - 1)
  }

  private writeInstance(enemy: IZombie, index: number, elapsed: number): void {
    const size = enemy.kind === 'tank' ? 1.35 : enemy.kind === 'runner' ? 0.82 : 1
    this.position.set(enemy.x, Math.sin(elapsed * 8 + enemy.phase) * 0.035, enemy.z)
    this.scale.set(size, size, size)
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(enemy.vx, enemy.vz))
    this.matrix.compose(this.position, this.quaternion, this.scale)
    this.mesh.setMatrixAt(index, this.matrix)
    this.color.set(enemy.hitFlash > 0 ? 0xe8ffd1 : enemy.kind === 'tank' ? 0x526b45 : enemy.kind === 'runner' ? 0x8f9c59 : 0x647650)
    this.mesh.setColorAt(index, this.color)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    const material = this.mesh.material
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
    else material.dispose()
  }
}
