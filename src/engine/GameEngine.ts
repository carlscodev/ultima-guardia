import { ProceduralAudio } from '@/audio/ProceduralAudio'
import { EnemySystem } from '@/engine/systems/EnemySystem'
import { CityScene, type SceneView } from '@/engine/CityScene'
import { clamp, distanceSquared, randomRange } from '@/engine/math'
import type { EngineEvents, GameState, InputState, IPlayer, IUpgrade, IWeapon, IZombie, ScreenState, WeaponKind, ZombieKind } from '@/types/game'

interface Projectile { active: boolean; x: number; y: number; previousX: number; previousY: number; vx: number; vy: number; life: number; damage: number }
interface Pickup { active: boolean; x: number; y: number; amount: number; medical: boolean; life: number; phase: number }
interface Particle { active: boolean; x: number; y: number; height: number; vx: number; vy: number; vertical: number; life: number; maxLife: number; color: string }

const FIXED_STEP = 1 / 60
const WORLD = 1200
const MAX_PROJECTILES = 180
const MAX_PICKUPS = 150
const MAX_PARTICLES = 420

const WEAPONS: Record<WeaponKind, IWeapon> = {
  rifle: { kind: 'rifle', title: 'Rifle M4', pellets: 1, spread: 0.018, projectileSpeed: 520, recoil: 0.8, damageMultiplier: 1, intervalMultiplier: 1 },
  shotgun: { kind: 'shotgun', title: 'Escopeta K-12', pellets: 7, spread: 0.2, projectileSpeed: 450, recoil: 2.5, damageMultiplier: 0.46, intervalMultiplier: 3.15 },
}

const UPGRADES: readonly IUpgrade[] = [
  { id: 'fireRate', name: 'CICLO RÁPIDO', description: 'Cadencia de fuego +18%.', icon: '⌁' },
  { id: 'damage', name: 'MUNICIÓN PESADA', description: 'Daño balístico +25%.', icon: '◆' },
  { id: 'speed', name: 'BOTAS TÁCTICAS', description: 'Velocidad de movimiento +15%.', icon: '»' },
  { id: 'pulse', name: 'SOBRECARGA EMP', description: 'El pulso causa más daño.', icon: '◎' },
  { id: 'armor', name: 'PLACAS CERÁMICAS', description: '+20 de vida y curación inmediata.', icon: '✚' },
  { id: 'range', name: 'ÓPTICA TÉRMICA', description: 'Alcance de adquisición +20%.', icon: '⌖' },
]

/** Motor Canvas2D isométrico. La simulación y sus coordenadas nunca son reactivas. */
export class GameEngine {
  private readonly context: CanvasRenderingContext2D
  private readonly audio = new ProceduralAudio()
  private readonly enemies = new EnemySystem()
  private readonly projectiles = Array.from({ length: MAX_PROJECTILES }, (): Projectile => ({ active: false, x: 0, y: 0, previousX: 0, previousY: 0, vx: 0, vy: 0, life: 0, damage: 0 }))
  private readonly pickups = Array.from({ length: MAX_PICKUPS }, (): Pickup => ({ active: false, x: 0, y: 0, amount: 1, medical: false, life: 0, phase: 0 }))
  private readonly particles = Array.from({ length: MAX_PARTICLES }, (): Particle => ({ active: false, x: 0, y: 0, height: 0, vx: 0, vy: 0, vertical: 0, life: 0, maxLife: 1, color: '#fff' }))
  private readonly visibleEnemies: IZombie[] = []
  private readonly city = new CityScene()
  private readonly sceneView: SceneView = { width: 640, height: 360, scale: 1, cameraX: WORLD / 2, cameraY: WORLD / 2 }
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private readonly state: GameState
  private player: IPlayer
  private animationFrame = 0
  private lastFrame = 0
  private accumulator = 0
  private cameraX = WORLD / 2
  private cameraY = WORLD / 2
  private width = 640
  private height = 360
  private projectionScale = 1
  private renderScale = 0.72
  private shotTimer = 0
  private spawnTimer = 0
  private spawnRemaining = 0
  private waveDelay = 0
  private hudTimer = 0
  private hitGate = 0
  private pulseAnimation = 0
  private bannerTimer = 0
  private shake = 0
  private damageFlash = 0
  private fpsFrames = 0
  private fpsTime = 0
  private qualityTime = 0
  private frameMs = 16.7
  private disposed = false
  private loopStarted = false
  private vignette: CanvasGradient | null = null

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly input: InputState,
    private readonly events: EngineEvents,
  ) {
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!context) throw new Error('Canvas2D no está disponible')
    this.context = context
    this.context.imageSmoothingEnabled = false
    this.player = this.createPlayer()
    this.state = this.createState()
    this.resize()
    this.publishHud()
    this.render()
  }

  start(): void {
    void this.audio.unlock().catch(() => this.audio.setMuted(true))
    this.audio.setMuffled(false)
    this.reset()
    this.nextWave()
    this.setScreen('playing')
    if (!this.loopStarted) {
      this.loopStarted = true
      this.lastFrame = performance.now()
      this.loop(this.lastFrame)
    } else this.lastFrame = performance.now()
  }

  setMuted(muted: boolean): void { this.audio.setMuted(muted) }

  returnToMenu(): void {
    this.audio.setMuffled(true)
    cancelAnimationFrame(this.animationFrame)
    this.loopStarted = false
    this.reset()
    this.setScreen('menu')
    this.render()
  }

  togglePause(): void {
    if (this.state.screen === 'playing') { this.setScreen('paused'); this.audio.setMuffled(true) }
    else if (this.state.screen === 'paused') { this.setScreen('playing'); this.audio.setMuffled(false); this.lastFrame = performance.now() }
  }

  chooseUpgrade(upgrade: IUpgrade): void {
    if (this.state.screen !== 'levelup') return
    switch (upgrade.id) {
      case 'fireRate': this.player.fireInterval = Math.max(0.08, this.player.fireInterval * 0.82); break
      case 'damage': this.player.damage *= 1.25; break
      case 'speed': this.player.speed *= 1.15; break
      case 'pulse': this.player.pulsePower += 30; break
      case 'armor': this.player.maxHp += 20; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35); break
      case 'range': this.player.range += 70; break
    }
    this.setScreen('playing'); this.audio.setMuffled(false); this.lastFrame = performance.now()
  }

  resize(): void {
    const cssWidth = Math.max(320, window.innerWidth)
    const cssHeight = Math.max(240, window.innerHeight)
    const maxScale = Math.min(1, 1280 / cssWidth, 800 / cssHeight)
    this.renderScale = Math.min(this.renderScale, maxScale)
    this.width = Math.max(320, Math.round(cssWidth * this.renderScale))
    this.height = Math.max(240, Math.round(cssHeight * this.renderScale))
    this.canvas.width = this.width; this.canvas.height = this.height
    this.projectionScale = cssWidth < 650 ? Math.min(this.width / 390, this.height / 520) : Math.min(this.width / 620, this.height / 430)
    this.context.imageSmoothingEnabled = false
    this.vignette = this.context.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.1, this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.65)
    this.vignette.addColorStop(0, '#08160f00'); this.vignette.addColorStop(0.52, '#08160f18'); this.vignette.addColorStop(1, '#050d0bdd')
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.audio.dispose()
    delete window.__UG_DEBUG__
  }

  private loop = (now: number): void => {
    if (this.disposed) return
    const rawDelta = Math.min((now - this.lastFrame) / 1000 || 0, 0.1)
    this.lastFrame = now
    this.frameMs = this.frameMs * 0.9 + rawDelta * 1000 * 0.1
    this.fpsFrames += 1; this.fpsTime += rawDelta; this.qualityTime += rawDelta
    if (this.fpsTime >= 0.5) {
      this.state.fps = Math.round(this.fpsFrames / this.fpsTime)
      this.fpsFrames = 0; this.fpsTime = 0
    }
    if (this.qualityTime >= 3) { this.adaptQuality(); this.qualityTime = 0 }
    if (this.state.screen === 'playing' && !document.hidden) {
      this.accumulator = Math.min(this.accumulator + rawDelta, FIXED_STEP * 5)
      while (this.accumulator >= FIXED_STEP && this.state.screen === 'playing') { this.update(FIXED_STEP); this.accumulator -= FIXED_STEP }
      this.render()
    } else this.accumulator = 0
    window.__UG_DEBUG__ = { fps: this.state.fps, frameMs: Number(this.frameMs.toFixed(2)), enemies: this.enemies.count, renderScale: this.renderScale, mode: 'canvas2d', elapsed: this.state.elapsed, screen: this.state.screen, playerX: this.player.x, playerY: this.player.y, kills: this.state.kills, wave: this.state.wave, level: this.player.level, hp: this.player.hp, pulseCooldown: this.state.pulseCooldown, weapon: this.player.weapon }
    this.animationFrame = requestAnimationFrame(this.loop)
  }

  private adaptQuality(): void {
    const previous = this.renderScale
    if (this.state.fps < 48 && this.renderScale > 0.5) this.renderScale = Math.max(0.5, this.renderScale - 0.08)
    else if (this.state.fps > 57 && this.renderScale < 0.78) this.renderScale = Math.min(0.78, this.renderScale + 0.04)
    if (Math.abs(previous - this.renderScale) > 0.01) this.resize()
  }

  private update(dt: number): void {
    this.state.elapsed += dt; this.shotTimer -= dt; this.spawnTimer -= dt; this.hudTimer -= dt
    this.state.pulseCooldown = Math.max(0, this.state.pulseCooldown - dt)
    this.player.invulnerability = Math.max(0, this.player.invulnerability - dt)
    this.hitGate = Math.max(0, this.hitGate - dt); this.pulseAnimation = Math.max(0, this.pulseAnimation - dt)
    this.bannerTimer = Math.max(0, this.bannerTimer - dt); this.shake = Math.max(0, this.shake - dt * 12); this.damageFlash = Math.max(0, this.damageFlash - dt * 1.5)
    this.consumeInput(); this.updatePlayer(dt); this.updateWaves(dt)
    this.enemies.update(dt, this.player.x, this.player.y, (damage) => this.attackPlayer(damage))
    this.enemies.forEachActive((enemy) => this.city.resolve(enemy, enemy.radius, this.player, enemy.speed * dt))
    if (this.player.hp <= 0) { this.gameOver(); return }
    this.autoFire(); this.updateProjectiles(dt); this.updatePickups(dt); this.updateParticles(dt)
    const follow = 1 - Math.exp(-8 * dt)
    this.cameraX += (this.player.x - this.cameraX) * follow; this.cameraY += (this.player.y - this.cameraY) * follow
    if (this.hudTimer <= 0) { this.publishHud(); this.hudTimer = 0.1 }
    if (this.player.hp <= 0) this.gameOver()
  }

  private consumeInput(): void {
    if (this.input.weaponQueued) { this.player.weapon = this.input.weaponQueued; this.state.weapon = this.input.weaponQueued; this.input.weaponQueued = null }
    if (this.input.pulseQueued) { this.input.pulseQueued = false; this.pulse() }
  }

  private updatePlayer(dt: number): void {
    const sx = this.input.moveX; const sy = this.input.moveY; const inputLength = Math.hypot(sx, sy)
    if (inputLength <= 0.05) return
    let dx = sx / 0.86 + sy / 0.47; let dy = sy / 0.47 - sx / 0.86
    const worldLength = Math.hypot(dx, dy) || 1; const speed = this.player.speed * Math.min(1, inputLength)
    dx /= worldLength; dy /= worldLength
    this.player.x = clamp(this.player.x + dx * speed * dt, 15, WORLD - 15)
    this.player.y = clamp(this.player.y + dy * speed * dt, 15, WORLD - 15)
    this.city.resolve(this.player, 9)
  }

  private updateWaves(dt: number): void {
    if (this.spawnRemaining > 0 && this.spawnTimer <= 0 && this.enemies.count < Math.min(240, 60 + this.state.wave * 8)) {
      const roll = Math.random()
      const kind: ZombieKind = this.state.wave >= 3 && roll < 0.15 ? 'tank' : this.state.wave >= 2 && roll < 0.42 ? 'runner' : 'walker'
      const radius = Math.max(this.width / (1.72 * this.projectionScale), this.height / (0.94 * this.projectionScale)) + 90
      if (this.enemies.spawn(kind, this.state.wave, this.player.x, this.player.y, radius)) this.spawnRemaining -= 1
      this.spawnTimer = Math.max(0.16, 0.82 - this.state.wave * 0.03)
    }
    if (this.spawnRemaining === 0 && this.enemies.count === 0) {
      this.waveDelay += dt
      if (this.waveDelay > 2.2) { this.waveDelay = 0; this.nextWave() }
    }
  }

  private nextWave(): void {
    this.state.wave += 1
    this.spawnRemaining = Math.floor(7 + this.state.wave * 3.4 + Math.pow(this.state.wave, 1.18))
    this.spawnTimer = 0.35; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8); this.bannerTimer = 2.2
  }

  private autoFire(): void {
    if (this.shotTimer > 0) return
    const target = this.enemies.nearest(this.player.x, this.player.y, this.player.range)
    if (!target) return
    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x)
    this.player.angle = baseAngle
    const weapon = WEAPONS[this.player.weapon]
    for (let pellet = 0; pellet < weapon.pellets; pellet += 1) this.spawnProjectile(baseAngle + randomRange(-weapon.spread, weapon.spread), weapon)
    this.shotTimer = this.player.fireInterval * weapon.intervalMultiplier; this.shake = weapon.recoil
    this.spawnParticles(this.player.x + Math.cos(baseAngle) * 15, this.player.y + Math.sin(baseAngle) * 15, '#ffe7a0', weapon.kind === 'shotgun' ? 8 : 3)
    this.audio.shot(weapon.kind === 'shotgun')
  }

  private spawnProjectile(angle: number, weapon: IWeapon): void {
    const projectile = this.projectiles.find((entry) => !entry.active)
    if (!projectile) return
    projectile.active = true; projectile.x = this.player.x; projectile.y = this.player.y; projectile.previousX = projectile.x; projectile.previousY = projectile.y
    projectile.vx = Math.cos(angle) * weapon.projectileSpeed; projectile.vy = Math.sin(angle) * weapon.projectileSpeed
    projectile.life = this.player.range / weapon.projectileSpeed; projectile.damage = this.player.damage * weapon.damageMultiplier
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue
      projectile.previousX = projectile.x; projectile.previousY = projectile.y
      projectile.x += projectile.vx * dt; projectile.y += projectile.vy * dt; projectile.life -= dt
      let victim: IZombie | null = null; let first = 2
      const segmentX = projectile.x - projectile.previousX; const segmentY = projectile.y - projectile.previousY
      this.enemies.forEachActive((enemy) => {
        const t = clamp(((enemy.x - projectile.previousX) * segmentX + (enemy.y - projectile.previousY) * segmentY) / (segmentX * segmentX + segmentY * segmentY || 1), 0, 1)
        const hitX = projectile.previousX + segmentX * t; const hitY = projectile.previousY + segmentY * t
        if (distanceSquared(hitX, hitY, enemy.x, enemy.y) < enemy.radius * enemy.radius && t < first) { first = t; victim = enemy }
      })
      if (victim) {
        const target = victim as IZombie
        const killed = this.enemies.damage(target, projectile.damage)
        this.spawnParticles(target.x, target.y, '#a7c96b', 5); projectile.active = false; this.audio.impact()
        if (killed) this.onKilled(target, killed)
      }
      if (projectile.life <= 0) projectile.active = false
    }
  }

  private onKilled(enemy: IZombie, kind: ZombieKind): void {
    this.state.kills += 1
    this.spawnPickup(enemy.x, enemy.y, kind === 'tank' ? 3 : 1, Math.random() < 0.12)
  }

  private spawnPickup(x: number, y: number, amount: number, medical: boolean): void {
    const pickup = this.pickups.find((entry) => !entry.active)
    if (!pickup) return
    pickup.active = true; pickup.x = x; pickup.y = y; pickup.amount = amount; pickup.medical = medical; pickup.life = 24; pickup.phase = Math.random() * 7
  }

  private updatePickups(dt: number): void {
    for (const pickup of this.pickups) {
      if (!pickup.active) continue
      pickup.life -= dt; const sq = distanceSquared(pickup.x, pickup.y, this.player.x, this.player.y)
      if (!pickup.medical && sq < 75 * 75) { const pull = Math.min(1, dt * 5); pickup.x += (this.player.x - pickup.x) * pull; pickup.y += (this.player.y - pickup.y) * pull }
      if (sq < 20 * 20) {
        pickup.active = false
        if (pickup.medical) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30)
        else { this.player.xp += pickup.amount; this.checkLevelUp() }
        this.spawnParticles(pickup.x, pickup.y, pickup.medical ? '#c7fa98' : '#8cdbdc', 10)
        if (this.state.screen !== 'playing') return
      }
      if (pickup.life <= 0) pickup.active = false
    }
  }

  private checkLevelUp(): void {
    if (this.player.xp < this.player.xpNeeded) return
    this.player.xp -= this.player.xpNeeded; this.player.level += 1; this.player.xpNeeded = Math.ceil(this.player.xpNeeded * 1.35 + 1)
    this.setScreen('levelup'); this.audio.setMuffled(true)
    const choices = [...UPGRADES]
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); const current = choices[i]!
      choices[i] = choices[j]!; choices[j] = current
    }
    this.events.onUpgrades(choices.slice(0, 3))
  }

  private pulse(): void {
    if (this.state.pulseCooldown > 0) return
    this.state.pulseCooldown = 9; this.pulseAnimation = 0.55; this.shake = 2.5
    this.enemies.forEachActive((enemy) => {
      const dx = enemy.x - this.player.x; const dy = enemy.y - this.player.y; const distance = Math.hypot(dx, dy)
      if (distance >= 150) return
      const killed = this.enemies.damage(enemy, this.player.pulsePower); const inverse = 1 / Math.max(1, distance)
      enemy.x += dx * inverse * 85; enemy.y += dy * inverse * 85; enemy.knockback = 0.35
      if (killed) this.onKilled(enemy, killed)
    })
    this.spawnParticles(this.player.x, this.player.y, '#daf7ab', 28); this.audio.pulse()
  }

  private attackPlayer(damage: number): void {
    if (this.hitGate > 0) return
    this.player.hp -= damage; this.player.invulnerability = 0.72; this.hitGate = 0.72; this.damageFlash = 1; this.shake = 3
    this.spawnParticles(this.player.x, this.player.y, '#e88370', 9)
  }

  private spawnParticles(x: number, y: number, color: string, amount: number): void {
    let emitted = 0
    for (const particle of this.particles) {
      if (particle.active) continue
      particle.active = true; particle.x = x; particle.y = y; particle.height = randomRange(5, 18); particle.vx = randomRange(-55, 55); particle.vy = randomRange(-55, 55); particle.vertical = randomRange(15, 48)
      particle.life = randomRange(0.2, 0.65); particle.maxLife = particle.life; particle.color = color
      emitted += 1; if (emitted >= amount) break
    }
  }

  private updateParticles(dt: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue
      particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.height += particle.vertical * dt; particle.vertical -= 140 * dt; particle.life -= dt
      if (particle.life <= 0 || particle.height < 0) particle.active = false
    }
  }

  private render(): void {
    const ctx = this.context
    this.sceneView.width = this.width; this.sceneView.height = this.height; this.sceneView.scale = this.projectionScale; this.sceneView.cameraX = this.cameraX; this.sceneView.cameraY = this.cameraY
    ctx.fillStyle = '#101d17'; ctx.fillRect(0, 0, this.width, this.height)
    ctx.save()
    if (this.shake > 0 && !this.reducedMotion) ctx.translate(randomRange(-this.shake, this.shake) * this.projectionScale, randomRange(-this.shake, this.shake) * this.projectionScale)
    this.drawWorld(); this.city.drawPlayerLight(ctx, this.sceneView, this.player); this.drawPickups()
    if (this.pulseAnimation > 0) this.drawPulse()
    this.drawActors(); this.drawProjectiles(); this.drawParticles()
    ctx.restore()
    if (!this.reducedMotion) this.city.drawRain(ctx, this.sceneView, this.state.elapsed)
    if (this.vignette) { ctx.fillStyle = this.vignette; ctx.fillRect(0, 0, this.width, this.height) }
    if (this.damageFlash > 0) { ctx.fillStyle = `rgba(150,55,25,${this.damageFlash * .12})`; ctx.fillRect(0, 0, this.width, this.height) }
    if (this.bannerTimer > 0 && this.state.screen === 'playing') {
      ctx.textAlign = 'center'; ctx.font = `700 ${Math.max(24, 30 * this.projectionScale)}px "Barlow Condensed", sans-serif`; ctx.fillStyle = `rgba(211,237,179,${Math.min(1, this.bannerTimer)})`; ctx.fillText(`OLEADA ${String(this.state.wave).padStart(2, '0')}`, this.width / 2, this.height * .28)
    }
  }

  private drawWorld(): void { this.city.drawGround(this.context, this.sceneView) }

  private drawActors(): void {
    this.visibleEnemies.length = 0
    this.enemies.forEachActive((enemy) => { if (this.isVisible(enemy.x, enemy.y, 80)) this.visibleEnemies.push(enemy) })
    this.visibleEnemies.sort((a, b) => a.x + a.y - b.x - b.y)
    let playerDrawn = false; let propIndex = 0; const playerDepth = this.player.x + this.player.y
    const sceneryBefore = (depth: number): void => {
      while (propIndex < this.city.props.length) {
        const prop = this.city.props[propIndex]!
        if (prop.sortDepth > depth) break
        this.city.drawProp(this.context, prop, this.sceneView, this.player); propIndex++
      }
    }
    for (const enemy of this.visibleEnemies) {
      if (!playerDrawn && enemy.x + enemy.y > playerDepth) { sceneryBefore(playerDepth); this.drawCharacter(this.player, true); playerDrawn = true }
      sceneryBefore(enemy.x + enemy.y); this.drawCharacter(enemy, false)
    }
    if (!playerDrawn) { sceneryBefore(playerDepth); this.drawCharacter(this.player, true) }
    sceneryBefore(Infinity)
  }

  private drawCharacter(entity: IPlayer | IZombie, human: boolean): void {
    const ctx = this.context; const enemy = human ? null : entity as IZombie
    const tank = enemy?.kind === 'tank'; const runner = enemy?.kind === 'runner'; const size = this.projectionScale * (tank ? 1.5 : runner ? .85 : 1)
    const px = this.projectX(entity.x, entity.y); const py = this.projectY(entity.x, entity.y)
    ctx.fillStyle = '#030b0780'; ctx.beginPath(); ctx.ellipse(px + 3 * size, py + size, 13 * size, 5 * size, 0, 0, Math.PI * 2); ctx.fill()
    if (human) { ctx.strokeStyle = '#c1ec8975'; ctx.lineWidth = .7 * size; ctx.beginPath(); ctx.ellipse(px, py, 16 * size, 7 * size, 0, 0, Math.PI * 2); ctx.stroke() }
    if (human && this.player.invulnerability > 0 && Math.floor(this.state.elapsed * 20) % 2 === 0) return
    const moving = !human || Math.abs(this.input.moveX) + Math.abs(this.input.moveY) > .1
    const step = moving ? Math.sin(this.state.elapsed * 11 + (enemy?.phase ?? 0)) * 2 : 0
    ctx.save(); ctx.translate(Math.round(px), Math.round(py))
    const rect = (x: number, y: number, w: number, h: number, color: string): void => { ctx.fillStyle = color; ctx.fillRect(Math.round(x * size), Math.round(y * size), Math.ceil(w * size), Math.ceil(h * size)) }
    const flash = Boolean(enemy && enemy.hitFlash > 0)
    const skin = human ? '#cfbb94' : tank ? '#8d9167' : runner ? '#b0a67d' : '#91a27c'
    const coat = flash ? '#dae8b5' : human ? '#7d8c61' : tank ? '#5a6945' : (enemy?.id ?? 0) % 3 === 0 ? '#75644b' : '#546c53'
    rect(-7, -12 + step, 5, 10, '#2a3c2a'); rect(2, -12 - step, 5, 10, '#384833')
    rect(-8, -3 + step, 6, 3, '#142619'); rect(2, -3 - step, 7, 3, '#1b2b1c')
    if (human) { rect(-10, -24, 5, 15, '#3d5234'); rect(-11, -22, 2, 9, '#a3a279') }
    rect(-8, -23, 16, 15, '#273c2a'); rect(-7, -23, 14, 14, coat)
    rect(-5, -20, 5, 8, human ? '#a1ad7b' : '#788b60'); rect(1, -20, 5, 8, '#465c3a')
    rect(-7, -10, 14, 3, '#2b3e28'); rect(-1, -10, 3, 2, '#c6b98a')
    rect(-11, -21, 4, 10, coat); rect(7, -21, 4, 10, coat)
    rect(-10, -13, 3, 5, skin); rect(8, -13, 3, 5, skin)
    rect(-5, -33, 11, 11, flash ? '#e9edc5' : skin)
    rect(-5, -25, 4, 3, human ? '#aa936b' : '#5b7050')
    if (human) { rect(-6, -36, 12, 6, '#8e9b6b'); rect(-7, -33, 14, 4, '#657e4e'); rect(-4, -36, 8, 2, '#b0b483'); rect(-4, -29, 10, 3, '#253c2b'); rect(3, -28, 2, 1, '#c9df9b') }
    else { rect(-5, -34, 10, 4, '#374c31'); rect(-6, -32, 3, 6, '#3b5135'); rect(-3, -28, 2, 2, '#d9b576'); rect(3, -28, 2, 2, '#d9b576'); rect(0, -24, 3, 1, '#435237') }
    if (human) {
      const angle = Math.atan2((Math.cos(this.player.angle) + Math.sin(this.player.angle)) * .47, (Math.cos(this.player.angle) - Math.sin(this.player.angle)) * .86)
      ctx.save(); ctx.translate(0, -18 * size); ctx.rotate(angle)
      rect(0, -2, 9, 5, '#45523a'); rect(6, -2, 19, 4, '#15291e'); rect(10, -3, 12, 1, '#819077'); rect(13, 2, 4, 5, '#263b29'); rect(24, -1, 5, 2, '#9aab88')
      if (this.shotTimer > this.player.fireInterval * WEAPONS[this.player.weapon].intervalMultiplier - .055) { rect(29, -3, 6, 6, '#ebc67b'); rect(31, -1, 8, 2, '#fff0be') }
      ctx.restore()
      ctx.fillStyle = '#c2eb89'; ctx.beginPath(); ctx.moveTo(-2 * size, -43 * size); ctx.lineTo(2 * size, -43 * size); ctx.lineTo(0, -40 * size); ctx.fill()
    }
    ctx.restore()
    if (enemy && enemy.hp < enemy.maxHp) { ctx.fillStyle = '#132618'; ctx.fillRect(px - 10 * size, py - 41 * size, 20 * size, 2 * size); ctx.fillStyle = '#b8d479'; ctx.fillRect(px - 10 * size, py - 41 * size, 20 * size * enemy.hp / enemy.maxHp, 2 * size) }
  }

  private drawPickups(): void {
    const ctx = this.context; const s = this.projectionScale
    for (const item of this.pickups) {
      if (!item.active || !this.isVisible(item.x, item.y, 30)) continue
      const px = this.projectX(item.x, item.y); const py = this.projectY(item.x, item.y, 7 + Math.sin(this.state.elapsed * 5 + item.phase) * 2)
      ctx.fillStyle = item.medical ? '#c2eb8921' : '#8cdbdc21'; ctx.beginPath(); ctx.ellipse(px, this.projectY(item.x, item.y), 12 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill()
      if (item.medical) {
        ctx.fillStyle = '#536e45'; ctx.fillRect(px - 7 * s, py - 4 * s, 14 * s, 10 * s)
        ctx.fillStyle = '#b1c396'; ctx.fillRect(px - 7 * s, py - 5 * s, 14 * s, 3 * s)
        ctx.fillStyle = '#ddf5b9'; ctx.fillRect(px - s, py - 2 * s, 2 * s, 6 * s); ctx.fillRect(px - 3 * s, py, 6 * s, 2 * s)
      } else {
        const r = (item.amount > 1 ? 6 : 4) * s
        ctx.fillStyle = '#83b9aa'; ctx.beginPath(); ctx.moveTo(px, py - r * 1.5); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.closePath(); ctx.fill()
        ctx.fillStyle = '#d4eed7'; ctx.beginPath(); ctx.moveTo(px, py - r * 1.5); ctx.lineTo(px, py); ctx.lineTo(px - r, py); ctx.closePath(); ctx.fill()
      }
    }
  }

  private drawProjectiles(): void {
    const ctx = this.context; ctx.beginPath()
    for (const bullet of this.projectiles) if (bullet.active) { ctx.moveTo(this.projectX(bullet.x, bullet.y), this.projectY(bullet.x, bullet.y, 18)); ctx.lineTo(this.projectX(bullet.x - bullet.vx * .023, bullet.y - bullet.vy * .023), this.projectY(bullet.x - bullet.vx * .023, bullet.y - bullet.vy * .023, 18)) }
    ctx.strokeStyle = '#edbd6030'; ctx.lineWidth = 6 * this.projectionScale; ctx.stroke()
    ctx.strokeStyle = '#ffe6a5'; ctx.lineWidth = Math.max(1, 1.5 * this.projectionScale); ctx.stroke()
  }

  private drawParticles(): void {
    const ctx = this.context
    for (const particle of this.particles) if (particle.active) { ctx.globalAlpha = Math.min(1, particle.life * 4); ctx.fillStyle = particle.color; ctx.fillRect(this.projectX(particle.x, particle.y), this.projectY(particle.x, particle.y, particle.height), Math.max(1, 2 * this.projectionScale), Math.max(1, 2 * this.projectionScale)) }
    ctx.globalAlpha = 1
  }

  private drawPulse(): void {
    const progress = 1 - this.pulseAnimation / .55; const radius = progress * 160 * this.projectionScale; const ctx = this.context
    const x = this.projectX(this.player.x, this.player.y); const y = this.projectY(this.player.x, this.player.y)
    ctx.fillStyle = `rgba(193,235,137,${(1 - progress) * .07})`; ctx.strokeStyle = `rgba(211,255,158,${1 - progress})`; ctx.lineWidth = 2 * this.projectionScale
    ctx.beginPath(); ctx.ellipse(x, y, radius * 1.22, radius * .665, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = `rgba(226,255,198,${(1 - progress) * .45})`; ctx.lineWidth = this.projectionScale
    ctx.beginPath(); ctx.ellipse(x, y, radius * 1.08, radius * .59, 0, 0, Math.PI * 2); ctx.stroke()
  }

  private projectX(x: number, y: number): number { return this.width / 2 + (x - this.cameraX - (y - this.cameraY)) * 0.86 * this.projectionScale }
  private projectY(x: number, y: number, height = 0): number { return this.height / 2 + (x - this.cameraX + y - this.cameraY) * 0.47 * this.projectionScale - height * this.projectionScale }
  private isVisible(x: number, y: number, margin: number): boolean { const px = this.projectX(x, y); const py = this.projectY(x, y); return px > -margin && px < this.width + margin && py > -margin && py < this.height + margin }

  private createPlayer(): IPlayer { return { x: WORLD / 2, y: WORLD / 2, hp: 100, maxHp: 100, speed: 105, damage: 27, fireInterval: 0.28, range: 300, invulnerability: 0, angle: 0, xp: 0, level: 1, xpNeeded: 5, pulsePower: 65, weapon: 'rifle' } }
  private createState(): GameState { return { screen: 'menu', hp: 100, maxHp: 100, xp: 0, xpNeeded: 5, level: 1, wave: 0, kills: 0, elapsed: 0, pulseCooldown: 0, weapon: 'rifle', enemies: 0, fps: 60 } }

  private reset(): void {
    this.player = this.createPlayer(); this.enemies.reset(); this.projectiles.forEach((entry) => { entry.active = false }); this.pickups.forEach((entry) => { entry.active = false }); this.particles.forEach((entry) => { entry.active = false }); Object.assign(this.state, this.createState())
    this.cameraX = this.player.x; this.cameraY = this.player.y; this.accumulator = 0; this.shotTimer = 0; this.spawnRemaining = 0; this.waveDelay = 0; this.damageFlash = 0
    this.spawnTimer = 0; this.hudTimer = 0; this.hitGate = 0; this.pulseAnimation = 0; this.bannerTimer = 0; this.shake = 0; this.fpsFrames = 0; this.fpsTime = 0; this.qualityTime = 0; this.frameMs = 16.7
  }

  private setScreen(screen: ScreenState): void { this.state.screen = screen; this.events.onScreen(screen); this.publishHud() }
  private publishHud(): void { this.state.hp = this.player.hp; this.state.maxHp = this.player.maxHp; this.state.xp = this.player.xp; this.state.xpNeeded = this.player.xpNeeded; this.state.level = this.player.level; this.state.weapon = this.player.weapon; this.state.enemies = this.enemies.count; this.events.onHud(this.state) }
  private gameOver(): void { this.player.hp = 0; this.audio.setMuffled(true); this.setScreen('gameover') }
}
