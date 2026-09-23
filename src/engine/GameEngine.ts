import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ProceduralAudio } from '@/audio/ProceduralAudio'
import { EnemySystem } from '@/engine/systems/EnemySystem'
import { clamp, distanceSquared, lerpFactor, randomRange } from '@/engine/math'
import type { EngineEvents, GameState, InputState, IPlayer, IUpgrade, IWeapon, IZombie, ScreenState, WeaponKind, ZombieKind } from '@/types/game'

interface Projectile { active: boolean; x: number; z: number; vx: number; vz: number; life: number; damage: number }
interface Pickup { active: boolean; x: number; z: number; amount: number; medical: boolean; phase: number }
interface Spark { active: boolean; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number; color: number }

const FIXED_STEP = 1 / 60
const WORLD_HALF = 45
const MAX_PROJECTILES = 160
const MAX_PICKUPS = 160
const MAX_SPARKS = 700

const WEAPONS: Record<WeaponKind, IWeapon> = {
  rifle: { kind: 'rifle', title: 'Rifle M4', pellets: 1, spread: 0.018, projectileSpeed: 33, recoil: 0.08, damageMultiplier: 1, intervalMultiplier: 1 },
  shotgun: { kind: 'shotgun', title: 'Escopeta K-12', pellets: 7, spread: 0.22, projectileSpeed: 29, recoil: 0.32, damageMultiplier: 0.48, intervalMultiplier: 3.15 },
}

const UPGRADES: readonly IUpgrade[] = [
  { id: 'fireRate', name: 'CICLO RÁPIDO', description: 'Cadencia de fuego +18%.', icon: '⌁' },
  { id: 'damage', name: 'MUNICIÓN PESADA', description: 'Daño balístico +25%.', icon: '◆' },
  { id: 'speed', name: 'BOTAS TÁCTICAS', description: 'Velocidad de movimiento +15%.', icon: '»' },
  { id: 'pulse', name: 'SOBRECARGA EMP', description: 'El pulso causa más daño.', icon: '◎' },
  { id: 'armor', name: 'PLACAS CERÁMICAS', description: '+20 de vida y curación inmediata.', icon: '✚' },
  { id: 'range', name: 'ÓPTICA TÉRMICA', description: 'Alcance de adquisición +20%.', icon: '⌖' },
]

const damageShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    intensity: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float intensity; uniform vec2 resolution; varying vec2 vUv;
    void main(){
      vec2 p=vUv-.5; float edge=smoothstep(.28,.76,length(p*vec2(resolution.x/resolution.y,1.)));
      vec2 shift=normalize(p+vec2(.0001))*intensity*.008;
      float r=texture2D(tDiffuse,vUv+shift).r; float g=texture2D(tDiffuse,vUv).g; float b=texture2D(tDiffuse,vUv-shift).b;
      vec3 col=vec3(r,g,b); col*=1.-edge*.48; col+=vec3(.22,.005,.0)*edge*intensity;
      gl_FragColor=vec4(col,1.);
    }`,
}

export class GameEngine {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 180)
  private readonly composer: EffectComposer
  private readonly postPass: ShaderPass
  private readonly clock = new THREE.Clock(false)
  private readonly audio = new ProceduralAudio()
  private readonly enemies: EnemySystem
  private readonly playerModel = new THREE.Group()
  private readonly muzzleLight = new THREE.PointLight(0xffc76f, 0, 8, 2)
  private readonly projectileMesh: THREE.InstancedMesh
  private readonly pickupMesh: THREE.InstancedMesh
  private readonly sparkMesh: THREE.InstancedMesh
  private readonly projectiles: Projectile[]
  private readonly pickups: Pickup[]
  private readonly sparks: Spark[]
  private readonly instanceMatrix = new THREE.Matrix4()
  private readonly instanceColor = new THREE.Color()
  private readonly tempPosition = new THREE.Vector3()
  private readonly tempScale = new THREE.Vector3()
  private readonly tempQuaternion = new THREE.Quaternion()
  private readonly state: GameState
  private player: IPlayer
  private animationFrame = 0
  private accumulator = 0
  private shotTimer = 0
  private spawnTimer = 0
  private spawnRemaining = 0
  private waveDelay = 0
  private hudTimer = 0
  private invulnerabilityHitGate = 0
  private damageFx = 0
  private cameraKick = 0
  private roarTimer = 5
  private fpsSamples = 0
  private fpsElapsed = 0
  private disposed = false
  private loopStarted = false

  constructor(
    canvas: HTMLCanvasElement,
    private readonly input: InputState,
    private readonly events: EngineEvents,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.scene.background = new THREE.Color(0x06100f)
    this.scene.fog = new THREE.FogExp2(0x071412, 0.024)
    this.camera.position.set(18, 24, 22)

    this.buildEnvironment()
    this.buildPlayer()
    this.enemies = new EnemySystem(this.scene)
    this.projectileMesh = this.makeInstanceMesh(new THREE.SphereGeometry(0.08, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffe4a0 }), MAX_PROJECTILES)
    this.pickupMesh = this.makeInstanceMesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0x72e5e6, emissive: 0x246f70, emissiveIntensity: 2 }), MAX_PICKUPS)
    this.sparkMesh = this.makeInstanceMesh(new THREE.IcosahedronGeometry(0.055, 0), new THREE.MeshBasicMaterial({ vertexColors: true }), MAX_SPARKS)
    this.projectiles = Array.from({ length: MAX_PROJECTILES }, (): Projectile => ({ active: false, x: 0, z: 0, vx: 0, vz: 0, life: 0, damage: 0 }))
    this.pickups = Array.from({ length: MAX_PICKUPS }, (): Pickup => ({ active: false, x: 0, z: 0, amount: 1, medical: false, phase: 0 }))
    this.sparks = Array.from({ length: MAX_SPARKS }, (): Spark => ({ active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, color: 0xffffff }))

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.72, 0.38, 0.82))
    this.postPass = new ShaderPass(damageShader)
    this.composer.addPass(this.postPass)

    this.player = this.createPlayer()
    this.state = this.createState()
    this.resize()
    this.publishHud()
    this.render()
  }

  async start(): Promise<void> {
    await this.audio.unlock()
    this.audio.setMuffled(false)
    this.reset()
    this.setScreen('playing')
    this.nextWave()
    if (!this.loopStarted) {
      this.loopStarted = true
      this.clock.start()
      this.clock.getDelta()
      this.loop()
    } else {
      this.clock.getDelta()
    }
  }

  togglePause(): void {
    if (this.state.screen === 'playing') {
      this.setScreen('paused'); this.audio.setMuffled(true)
    } else if (this.state.screen === 'paused') {
      this.setScreen('playing'); this.audio.setMuffled(false); this.clock.getDelta()
    }
  }

  chooseUpgrade(upgrade: IUpgrade): void {
    if (this.state.screen !== 'levelup') return
    switch (upgrade.id) {
      case 'fireRate': this.player.fireInterval = Math.max(0.065, this.player.fireInterval * 0.82); break
      case 'damage': this.player.damage *= 1.25; break
      case 'speed': this.player.speed *= 1.15; break
      case 'pulse': this.player.pulsePower += 34; break
      case 'armor': this.player.maxHp += 20; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 38); break
      case 'range': this.player.range *= 1.2; break
    }
    this.setScreen('playing')
    this.audio.setMuffled(false)
    this.clock.getDelta()
  }

  resize(): void {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.composer.setSize(width, height)
    this.postPass.uniforms['resolution']?.value.set(width, height)
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.audio.dispose()
    this.enemies.dispose()
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        else object.material.dispose()
      }
    })
    this.composer.dispose()
    this.renderer.dispose()
  }

  private loop = (): void => {
    if (this.disposed) return
    const frameDelta = Math.min(this.clock.getDelta(), 0.1)
    this.fpsSamples += 1
    this.fpsElapsed += frameDelta
    if (this.fpsElapsed >= 0.5) {
      this.state.fps = Math.round(this.fpsSamples / this.fpsElapsed)
      this.fpsElapsed = 0; this.fpsSamples = 0
    }
    if (this.state.screen === 'playing') {
      this.accumulator = Math.min(this.accumulator + frameDelta, FIXED_STEP * 5)
      while (this.accumulator >= FIXED_STEP) { this.update(FIXED_STEP); this.accumulator -= FIXED_STEP }
    }
    this.render()
    this.animationFrame = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    this.state.elapsed += dt
    this.shotTimer -= dt; this.spawnTimer -= dt; this.hudTimer -= dt
    this.state.pulseCooldown = Math.max(0, this.state.pulseCooldown - dt)
    this.player.invulnerability = Math.max(0, this.player.invulnerability - dt)
    this.invulnerabilityHitGate = Math.max(0, this.invulnerabilityHitGate - dt)
    this.damageFx = Math.max(0, this.damageFx - dt * 1.7)
    this.cameraKick = Math.max(0, this.cameraKick - dt * 2.6)
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 110)

    this.consumeInput()
    this.updatePlayer(dt)
    this.updateWaves(dt)
    this.enemies.update(dt, this.player.x, this.player.z, this.state.elapsed, (damage) => this.attackPlayer(damage))
    this.autoFire()
    this.updateProjectiles(dt)
    this.updatePickups(dt)
    this.updateSparks(dt)
    this.updateCamera(dt)
    this.updateRoars(dt)
    if (this.hudTimer <= 0) { this.publishHud(); this.hudTimer = 0.1 }
    if (this.player.hp <= 0) this.gameOver()
  }

  private consumeInput(): void {
    if (this.input.weaponQueued) {
      this.player.weapon = this.input.weaponQueued
      this.state.weapon = this.input.weaponQueued
      this.input.weaponQueued = null
    }
    if (this.input.pulseQueued) { this.input.pulseQueued = false; this.pulse() }
  }

  private updatePlayer(dt: number): void {
    const length = Math.hypot(this.input.moveX, this.input.moveY)
    if (length > 0.05) {
      const nx = this.input.moveX / Math.max(1, length)
      const nz = this.input.moveY / Math.max(1, length)
      this.player.x = clamp(this.player.x + nx * this.player.speed * dt, -WORLD_HALF + 1, WORLD_HALF - 1)
      this.player.z = clamp(this.player.z + nz * this.player.speed * dt, -WORLD_HALF + 1, WORLD_HALF - 1)
    }
    this.playerModel.position.set(this.player.x, 0, this.player.z)
  }

  private updateWaves(dt: number): void {
    if (this.spawnRemaining > 0 && this.spawnTimer <= 0 && this.enemies.count < Math.min(300, 35 + this.state.wave * 10)) {
      const roll = Math.random()
      const kind: ZombieKind = this.state.wave >= 4 && roll < 0.13 ? 'tank' : this.state.wave >= 2 && roll < 0.4 ? 'runner' : 'walker'
      if (this.enemies.spawn(kind, this.state.wave, this.player.x, this.player.z)) this.spawnRemaining -= 1
      this.spawnTimer = Math.max(0.075, 0.56 - Math.pow(this.state.wave, 0.65) * 0.035)
    }
    if (this.spawnRemaining === 0 && this.enemies.count === 0) {
      this.waveDelay += dt
      if (this.waveDelay > 2.2) { this.waveDelay = 0; this.nextWave() }
    }
  }

  private nextWave(): void {
    this.state.wave += 1
    this.spawnRemaining = Math.floor(7 + this.state.wave * 3.2 + Math.pow(this.state.wave, 1.28) * 1.65)
    this.spawnTimer = 0.3
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8)
  }

  private autoFire(): void {
    if (this.shotTimer > 0) return
    const target = this.enemies.nearest(this.player.x, this.player.z, this.player.range)
    if (!target) return
    const baseAngle = Math.atan2(target.x - this.player.x, target.z - this.player.z)
    this.player.angle = baseAngle
    this.playerModel.rotation.y = baseAngle
    const weapon = WEAPONS[this.player.weapon]
    for (let pellet = 0; pellet < weapon.pellets; pellet += 1) {
      const angle = baseAngle + randomRange(-weapon.spread, weapon.spread)
      this.spawnProjectile(angle, weapon)
    }
    this.shotTimer = this.player.fireInterval * weapon.intervalMultiplier
    this.muzzleLight.intensity = this.player.weapon === 'shotgun' ? 17 : 9
    this.muzzleLight.position.set(this.player.x + Math.sin(baseAngle) * 1.15, 1.05, this.player.z + Math.cos(baseAngle) * 1.15)
    this.cameraKick = weapon.recoil
    this.audio.shot(this.player.weapon === 'shotgun')
  }

  private spawnProjectile(angle: number, weapon: IWeapon): void {
    const projectile = this.projectiles.find((entry) => !entry.active)
    if (!projectile) return
    projectile.active = true
    projectile.x = this.player.x + Math.sin(angle) * 0.9
    projectile.z = this.player.z + Math.cos(angle) * 0.9
    projectile.vx = Math.sin(angle) * weapon.projectileSpeed
    projectile.vz = Math.cos(angle) * weapon.projectileSpeed
    projectile.life = this.player.range / weapon.projectileSpeed
    projectile.damage = this.player.damage * weapon.damageMultiplier
  }

  private updateProjectiles(dt: number): void {
    let instance = 0
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue
      projectile.x += projectile.vx * dt; projectile.z += projectile.vz * dt; projectile.life -= dt
      const victim = this.enemies.nearest(projectile.x, projectile.z, 0.95)
      if (victim) {
        const killed = this.enemies.damage(victim, projectile.damage)
        this.spawnSparks(projectile.x, 0.9, projectile.z, 0xa6d86e, 7)
        this.audio.impact()
        projectile.active = false
        if (killed) this.onKilled(victim, killed)
      }
      if (projectile.life <= 0 || Math.abs(projectile.x) > WORLD_HALF || Math.abs(projectile.z) > WORLD_HALF) projectile.active = false
      if (!projectile.active) continue
      this.tempPosition.set(projectile.x, 0.9, projectile.z)
      this.instanceMatrix.makeTranslation(this.tempPosition)
      this.projectileMesh.setMatrixAt(instance, this.instanceMatrix)
      instance += 1
    }
    this.projectileMesh.count = instance
    this.projectileMesh.instanceMatrix.needsUpdate = true
  }

  private onKilled(enemy: IZombie, kind: ZombieKind): void {
    this.state.kills += 1
    this.spawnPickup(enemy.x, enemy.z, kind === 'tank' ? 3 : 1, Math.random() < 0.1)
  }

  private spawnPickup(x: number, z: number, amount: number, medical: boolean): void {
    const pickup = this.pickups.find((entry) => !entry.active)
    if (!pickup) return
    pickup.active = true; pickup.x = x; pickup.z = z; pickup.amount = amount; pickup.medical = medical; pickup.phase = Math.random() * 6
  }

  private updatePickups(dt: number): void {
    let instance = 0
    for (const pickup of this.pickups) {
      if (!pickup.active) continue
      const sq = distanceSquared(pickup.x, pickup.z, this.player.x, this.player.z)
      if (!pickup.medical && sq < 42) {
        const pull = lerpFactor(5, dt)
        pickup.x += (this.player.x - pickup.x) * pull; pickup.z += (this.player.z - pickup.z) * pull
      }
      if (sq < 1.5) {
        pickup.active = false
        if (pickup.medical) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30)
        else { this.player.xp += pickup.amount; this.checkLevelUp() }
        this.spawnSparks(pickup.x, 0.35, pickup.z, pickup.medical ? 0xb9ff91 : 0x72e5e6, 12)
        continue
      }
      const bob = 0.42 + Math.sin(this.state.elapsed * 4 + pickup.phase) * 0.1
      this.tempPosition.set(pickup.x, bob, pickup.z)
      this.tempQuaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, this.state.elapsed + pickup.phase)
      this.tempScale.setScalar(pickup.medical ? 1.35 : 1)
      this.instanceMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale)
      this.pickupMesh.setMatrixAt(instance, this.instanceMatrix)
      this.pickupMesh.setColorAt(instance, this.instanceColor.set(pickup.medical ? 0xaaff8a : 0x72e5e6))
      instance += 1
    }
    this.pickupMesh.count = instance; this.pickupMesh.instanceMatrix.needsUpdate = true
    if (this.pickupMesh.instanceColor) this.pickupMesh.instanceColor.needsUpdate = true
  }

  private checkLevelUp(): void {
    if (this.player.xp < this.player.xpNeeded) return
    this.player.xp -= this.player.xpNeeded
    this.player.level += 1
    this.player.xpNeeded = Math.ceil(this.player.xpNeeded * 1.35 + 1)
    const choices = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3)
    this.setScreen('levelup')
    this.audio.setMuffled(true)
    this.events.onUpgrades(choices)
  }

  private pulse(): void {
    if (this.state.pulseCooldown > 0) return
    this.state.pulseCooldown = 9
    this.enemies.forEachActive((enemy) => {
      const dx = enemy.x - this.player.x
      const dz = enemy.z - this.player.z
      const distance = Math.hypot(dx, dz)
      if (distance >= 8) return
      const killed = this.enemies.damage(enemy, this.player.pulsePower)
      const inverse = 1 / Math.max(0.2, distance)
      enemy.x += dx * inverse * 3.8; enemy.z += dz * inverse * 3.8; enemy.knockback = 0.35
      if (killed) this.onKilled(enemy, killed)
    })
    this.spawnSparks(this.player.x, 0.6, this.player.z, 0xcfff9c, 70)
    this.audio.pulse(); this.cameraKick = 0.48
  }

  private attackPlayer(damage: number): void {
    if (this.invulnerabilityHitGate > 0) return
    this.player.hp -= damage
    this.player.invulnerability = 0.7
    this.invulnerabilityHitGate = 0.7
    this.damageFx = 1
    this.cameraKick = 0.38
    this.spawnSparks(this.player.x, 1, this.player.z, 0xff6049, 18)
  }

  private spawnSparks(x: number, y: number, z: number, color: number, amount: number): void {
    let emitted = 0
    for (const spark of this.sparks) {
      if (spark.active) continue
      spark.active = true; spark.x = x; spark.y = y; spark.z = z
      spark.vx = randomRange(-4.5, 4.5); spark.vy = randomRange(1.5, 7); spark.vz = randomRange(-4.5, 4.5)
      spark.life = randomRange(0.2, 0.65); spark.maxLife = spark.life; spark.color = color
      emitted += 1
      if (emitted >= amount) break
    }
  }

  private updateSparks(dt: number): void {
    let instance = 0
    for (const spark of this.sparks) {
      if (!spark.active) continue
      spark.life -= dt
      if (spark.life <= 0) { spark.active = false; continue }
      spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.z += spark.vz * dt; spark.vy -= 12 * dt
      this.tempPosition.set(spark.x, Math.max(0.03, spark.y), spark.z)
      this.tempScale.setScalar(Math.max(0.3, spark.life / spark.maxLife))
      this.instanceMatrix.compose(this.tempPosition, this.tempQuaternion.identity(), this.tempScale)
      this.sparkMesh.setMatrixAt(instance, this.instanceMatrix)
      this.sparkMesh.setColorAt(instance, this.instanceColor.set(spark.color))
      instance += 1
    }
    this.sparkMesh.count = instance; this.sparkMesh.instanceMatrix.needsUpdate = true
    if (this.sparkMesh.instanceColor) this.sparkMesh.instanceColor.needsUpdate = true
  }

  private updateCamera(dt: number): void {
    const follow = lerpFactor(5.2, dt)
    const kick = this.cameraKick * randomRange(-0.16, 0.16)
    this.camera.position.x += (this.player.x + 18 + kick - this.camera.position.x) * follow
    this.camera.position.y += (24 - this.camera.position.y) * follow
    this.camera.position.z += (this.player.z + 22 + kick - this.camera.position.z) * follow
    this.camera.lookAt(this.player.x, 0, this.player.z)
  }

  private updateRoars(dt: number): void {
    this.roarTimer -= dt
    if (this.roarTimer <= 0 && this.enemies.count > 0) {
      this.audio.roar(Math.min(1, 8 / this.enemies.count))
      this.roarTimer = randomRange(4, 8)
    }
  }

  private render(): void {
    this.postPass.uniforms['intensity']!.value = this.damageFx
    this.playerModel.visible = !(this.player.invulnerability > 0 && Math.floor(this.state.elapsed * 18) % 2 === 0)
    this.composer.render()
  }

  private buildEnvironment(): void {
    const hemisphere = new THREE.HemisphereLight(0x9cb9b0, 0x07110d, 1.25)
    this.scene.add(hemisphere)
    const moon = new THREE.DirectionalLight(0xc7e0d8, 3.1)
    moon.position.set(-18, 32, 14); moon.castShadow = true
    moon.shadow.mapSize.set(2048, 2048)
    moon.shadow.camera.left = -35; moon.shadow.camera.right = 35; moon.shadow.camera.top = 35; moon.shadow.camera.bottom = -35
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 80; moon.shadow.bias = -0.0003
    this.scene.add(moon, this.muzzleLight)

    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = textureCanvas.height = 256
    const context = textureCanvas.getContext('2d')
    if (context) {
      context.fillStyle = '#17221f'; context.fillRect(0, 0, 256, 256)
      context.strokeStyle = '#283632'; context.lineWidth = 2
      for (let i = 0; i <= 256; i += 32) { context.beginPath(); context.moveTo(i, 0); context.lineTo(i, 256); context.stroke(); context.beginPath(); context.moveTo(0, i); context.lineTo(256, i); context.stroke() }
      for (let i = 0; i < 900; i += 1) { const shade = Math.floor(randomRange(20, 55)); context.fillStyle = `rgb(${shade},${shade + 7},${shade + 4})`; context.fillRect(Math.random() * 256, Math.random() * 256, 1, 1) }
    }
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(12, 12); texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(92, 92), new THREE.MeshStandardMaterial({ map: texture, color: 0x77817c, roughness: 0.93, metalness: 0.02 }))
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor)

    const road = new THREE.Mesh(new THREE.PlaneGeometry(17, 92), new THREE.MeshStandardMaterial({ color: 0x252c2c, roughness: 0.88 }))
    road.rotation.x = -Math.PI / 2; road.position.y = 0.012; road.receiveShadow = true; this.scene.add(road)
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xa99b61 })
    for (let z = -41; z < 45; z += 7) { const line = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 3.3), lineMaterial); line.rotation.x = -Math.PI / 2; line.position.set(0, 0.025, z); this.scene.add(line) }

    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1)
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x26352e, roughness: 0.72, metalness: 0.17 })
    const obstacles = new THREE.InstancedMesh(obstacleGeometry, obstacleMaterial, 54)
    obstacles.castShadow = true; obstacles.receiveShadow = true
    for (let i = 0; i < 54; i += 1) {
      const x = randomRange(-43, 43); const z = randomRange(-43, 43); const height = randomRange(0.5, 2.1)
      this.tempPosition.set(x, height / 2, z); this.tempScale.set(randomRange(0.5, 1.8), height, randomRange(0.5, 1.8))
      this.instanceMatrix.compose(this.tempPosition, this.tempQuaternion.identity(), this.tempScale); obstacles.setMatrixAt(i, this.instanceMatrix)
    }
    this.scene.add(obstacles)
  }

  private buildPlayer(): void {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 5, 8), new THREE.MeshStandardMaterial({ color: 0x638a80, roughness: 0.68 }))
    body.position.y = 1.05; body.castShadow = true
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), new THREE.MeshStandardMaterial({ color: 0xb99578, roughness: 0.75 }))
    head.position.y = 1.85; head.castShadow = true
    const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 1.35), new THREE.MeshStandardMaterial({ color: 0x151b1b, metalness: 0.75, roughness: 0.28 }))
    weapon.position.set(0.32, 1.18, 0.55); weapon.castShadow = true
    this.playerModel.add(body, head, weapon); this.scene.add(this.playerModel)
  }

  private makeInstanceMesh(geometry: THREE.BufferGeometry, material: THREE.Material, count: number): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; this.scene.add(mesh)
    return mesh
  }

  private createPlayer(): IPlayer {
    return { x: 0, z: 0, hp: 100, maxHp: 100, speed: 7.2, damage: 28, fireInterval: 0.26, range: 19, invulnerability: 0, angle: 0, xp: 0, level: 1, xpNeeded: 5, pulsePower: 68, weapon: 'rifle' }
  }

  private createState(): GameState {
    return { screen: 'menu', hp: 100, maxHp: 100, xp: 0, xpNeeded: 5, level: 1, wave: 0, kills: 0, elapsed: 0, pulseCooldown: 0, weapon: 'rifle', enemies: 0, fps: 60 }
  }

  private reset(): void {
    this.player = this.createPlayer(); this.enemies.reset()
    this.projectiles.forEach((entry) => { entry.active = false }); this.pickups.forEach((entry) => { entry.active = false }); this.sparks.forEach((entry) => { entry.active = false })
    Object.assign(this.state, this.createState())
    this.accumulator = 0; this.shotTimer = 0; this.spawnRemaining = 0; this.waveDelay = 0; this.damageFx = 0
    this.playerModel.position.set(0, 0, 0)
  }

  private setScreen(screen: ScreenState): void {
    this.state.screen = screen
    this.events.onScreen(screen)
    this.publishHud()
  }

  private publishHud(): void {
    this.state.hp = this.player.hp; this.state.maxHp = this.player.maxHp; this.state.xp = this.player.xp; this.state.xpNeeded = this.player.xpNeeded
    this.state.level = this.player.level; this.state.weapon = this.player.weapon; this.state.enemies = this.enemies.count
    this.events.onHud(this.state)
  }

  private gameOver(): void {
    this.player.hp = 0; this.audio.setMuffled(true); this.setScreen('gameover')
  }
}
