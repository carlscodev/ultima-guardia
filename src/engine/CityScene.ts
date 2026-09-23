import { clamp } from '@/engine/math'
import type { Vec2 } from '@/types/game'

export interface SceneView { width: number; height: number; scale: number; cameraX: number; cameraY: number }
type Point = readonly [number, number, number?]
type PropKind = 'building' | 'car' | 'crate' | 'barrier' | 'lamp' | 'barrel'
export interface CityProp {
  x: number; y: number; width: number; depth: number; height: number; kind: PropKind; variant: number
  image: HTMLCanvasElement; anchorX: number; anchorY: number; sortDepth: number; solid: boolean
}

class IsoPainter {
  constructor(readonly ctx: CanvasRenderingContext2D, readonly originX: number, readonly originY: number) {}
  x(x: number, y: number): number { return this.originX + (x - y) * .86 }
  y(x: number, y: number, z = 0): number { return this.originY + (x + y) * .47 - z }
  poly(points: readonly Point[], color: string): void {
    this.ctx.fillStyle = color; this.ctx.beginPath()
    points.forEach(([x, y, z], index) => { if (index === 0) this.ctx.moveTo(this.x(x, y), this.y(x, y, z)); else this.ctx.lineTo(this.x(x, y), this.y(x, y, z)) })
    this.ctx.closePath(); this.ctx.fill()
  }
  tile(x: number, y: number, w: number, d: number, color: string, z = 0): void {
    this.poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], color)
  }
  line(from: Point, to: Point, color: string, width = 1): void {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = width; this.ctx.beginPath(); this.ctx.moveTo(this.x(from[0], from[1]), this.y(from[0], from[1], from[2])); this.ctx.lineTo(this.x(to[0], to[1]), this.y(to[0], to[1], to[2])); this.ctx.stroke()
  }
  box(x: number, y: number, w: number, d: number, height: number, colors: readonly [string, string, string], z = 0): void {
    const l = x - w / 2; const r = x + w / 2; const t = y - d / 2; const b = y + d / 2
    this.poly([[l, b, z], [r, b, z], [r, b, z + height], [l, b, z + height]], colors[1])
    this.poly([[r, t, z], [r, b, z], [r, b, z + height], [r, t, z + height]], colors[2])
    this.tile(l, t, w, d, colors[0], z + height)
  }
}

export class CityScene {
  readonly props: CityProp[] = []
  private readonly ground = document.createElement('canvas')
  private readonly light = document.createElement('canvas')
  private readonly lamps: Vec2[] = []
  private readonly groundOriginX = 1100
  private readonly groundOriginY = 100

  constructor() {
    this.add('building', 392, 390, 174, 165, 133, 0)
    this.add('building', 217, 352, 128, 198, 162, 1)
    this.add('building', 811, 395, 168, 163, 150, 1)
    this.add('building', 998, 370, 155, 196, 175, 0)
    this.add('building', 393, 832, 168, 184, 113, 2)
    this.add('building', 238, 941, 128, 178, 147, 0)
    this.add('building', 832, 834, 180, 179, 139, 0)
    this.add('building', 1002, 970, 144, 151, 168, 1)
    this.add('car', 653, 419, 35, 67, 27, 0)
    this.add('car', 548, 827, 36, 70, 27, 1)
    this.add('car', 383, 652, 69, 35, 25, 2)
    this.add('car', 882, 546, 68, 34, 26, 0)
    this.add('barrier', 478, 520, 56, 13, 19, 0)
    this.add('barrier', 749, 680, 58, 14, 19, 0)
    this.add('barrier', 611, 975, 65, 14, 19, 0)
    this.add('crate', 462, 455, 24, 24, 24, 0)
    this.add('crate', 443, 477, 19, 22, 19, 0)
    this.add('crate', 742, 449, 25, 25, 24, 1)
    this.add('crate', 756, 424, 23, 23, 35, 0)
    this.add('crate', 730, 767, 27, 25, 22, 0)
    this.add('crate', 459, 747, 28, 23, 25, 1)
    this.add('barrel', 465, 792, 17, 17, 24, 0)
    this.add('barrel', 483, 805, 17, 17, 24, 1)
    this.add('barrel', 741, 476, 17, 17, 24, 0)
    for (const [x, y] of [[478, 464], [725, 466], [723, 728], [479, 722], [485, 175], [724, 1050], [179, 480], [1032, 724]] as const) {
      this.add('lamp', x, y, 29, 21, 90, 0, false); this.lamps.push({ x: x + 14, y })
    }
    this.props.sort((a, b) => a.sortDepth - b.sortDepth)
    this.paintGround()
    this.light.width = 160; this.light.height = 100
    const lightContext = this.light.getContext('2d')!
    const glow = lightContext.createRadialGradient(80, 50, 0, 80, 50, 76)
    glow.addColorStop(0, '#cde8a023'); glow.addColorStop(.4, '#a9c98e12'); glow.addColorStop(1, '#a9c98e00')
    lightContext.fillStyle = glow; lightContext.fillRect(0, 0, 160, 100)
  }

  private add(kind: PropKind, x: number, y: number, width: number, depth: number, height: number, variant: number, solid = true): void {
    const image = document.createElement('canvas')
    image.width = Math.ceil((width + depth) * .86) + 80
    image.height = Math.ceil((width + depth) * .47 + height) + 80
    const prop: CityProp = { x, y, width, depth, height, kind, variant, image, anchorX: image.width / 2, anchorY: height + (width + depth) * .235 + 40, sortDepth: x + y + (kind === 'building' ? (width + depth) * .21 : 0), solid }
    const ctx = image.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const painter = new IsoPainter(ctx, prop.anchorX, prop.anchorY)
    if (kind === 'building') this.paintBuilding(painter, prop)
    else if (kind === 'car') this.paintCar(painter, prop)
    else if (kind === 'crate') this.paintCrate(painter, prop)
    else if (kind === 'barrier') this.paintBarrier(painter, prop)
    else if (kind === 'lamp') this.paintLamp(painter)
    else this.paintBarrel(painter, variant)
    this.props.push(prop)
  }

  private paintGround(): void {
    this.ground.width = 2200; this.ground.height = 1380
    const ctx = this.ground.getContext('2d')!
    const p = new IsoPainter(ctx, this.groundOriginX, this.groundOriginY)
    p.tile(0, 0, 1200, 1200, '#27332b')
    let seed = 9142
    const random = (): number => { seed = seed * 16807 % 2147483647; return seed / 2147483647 }
    for (let x = 0; x < 1200; x += 40) for (let y = 0; y < 1200; y += 40) {
      p.tile(x + 1, y + 1, 38, 38, random() > .6 ? '#334036' : '#2e3b32')
      p.line([x + 3, y + 3], [x + 36, y + 3], '#5a675038', .7)
    }
    p.tile(491, 0, 217, 1200, '#586052'); p.tile(0, 491, 1200, 217, '#586052')
    p.tile(497, 0, 205, 1200, '#1c2926'); p.tile(0, 497, 1200, 205, '#1c2926')
    p.tile(502, 0, 195, 1200, '#2c3730'); p.tile(0, 502, 1200, 195, '#2c3730')
    p.tile(505, 0, 189, 1200, '#303a33'); p.tile(0, 505, 1200, 189, '#303a33')
    for (let i = 15; i < 1200; i += 63) {
      if (i > 460 && i < 710) continue
      p.tile(596, i, 3, 29, '#b6aa6b88'); p.tile(602, i, 3, 29, '#b6aa6b66')
      p.tile(i, 596, 29, 3, '#b6aa6b88'); p.tile(i, 602, 29, 3, '#b6aa6b66')
    }
    for (let i = 514; i < 689; i += 23) {
      for (const crossing of [472, 709]) { p.tile(i, crossing, 13, 28, '#b6b99a65'); p.tile(crossing, i, 28, 13, '#b6b99a65') }
    }
    for (let i = 0; i < 1600; i++) {
      const x = random() * 1200; const y = random() * 1200
      const onRoad = (x > 500 && x < 700) || (y > 500 && y < 700)
      p.tile(x, y, random() * 3 + 1, random() * 2 + 1, onRoad ? (random() > .6 ? '#89937a20' : '#081c1640') : '#10231a66')
    }
    for (let i = 0; i < 65; i++) {
      const x = random() * 1160 + 20; const y = random() * 1160 + 20
      p.poly([[x, y], [x + 18, y + 5], [x + 30, y - 2], [x + 45, y + 4], [x + 43, y + 18], [x + 19, y + 23], [x - 6, y + 12]], '#0d211b30')
      p.line([x + 3, y + 5], [x + 25, y + 6], '#93b2a414', .8)
    }
    for (let i = 0; i < 95; i++) {
      const side = i % 4; const a = random() * 1200; const b = 471 + random() * 12
      const x = side < 2 ? (side === 0 ? b : 1200 - b) : a
      const y = side < 2 ? a : (side === 2 ? b : 1200 - b)
      for (let n = 0; n < 4; n++) p.line([x + n * 2, y], [x - 1 + n * 3, y + 1, 3 + random() * 5], n % 2 ? '#75805a' : '#4c6143')
    }
    for (const prop of this.props) {
      if (prop.kind === 'lamp') continue
      const { x, y, width: w, depth: d, height: h } = prop
      p.poly([[x - w / 2, y + d / 2], [x + w / 2, y + d / 2], [x + w / 2 + h * .46, y + d / 2 + h * .36], [x - w / 2 + h * .46, y + d / 2 + h * .36]], '#08110c54')
    }
    for (const lamp of this.lamps) {
      const x = p.x(lamp.x, lamp.y); const y = p.y(lamp.x, lamp.y)
      ctx.save(); ctx.translate(x, y); ctx.scale(1, .58)
      const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 88)
      glow.addColorStop(0, '#e4c37833'); glow.addColorStop(.45, '#c9b27712'); glow.addColorStop(1, '#c9b27700')
      ctx.fillStyle = glow; ctx.fillRect(-90, -90, 180, 180); ctx.restore()
      for (let i = 0; i < 9; i++) { const offset = (random() - .5) * 40; ctx.fillStyle = '#d2b27023'; ctx.fillRect(x + offset, y + i * 2, 7 + random() * 15, 1) }
    }
    ctx.save(); ctx.translate(p.x(597, 760), p.y(597, 760)); ctx.transform(.86, .47, -.86, .47, 0, 0)
    ctx.font = '700 17px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#d0c79c33'; ctx.fillText('ZONA 09', 0, 0); ctx.restore()
    p.line([0, 0], [1200, 0], '#a7b08966', 2); p.line([1200, 0], [1200, 1200], '#a7b08966', 2)
    p.line([1200, 1200], [0, 1200], '#a7b08966', 2); p.line([0, 1200], [0, 0], '#a7b08966', 2)
  }

  private paintBuilding(p: IsoPainter, prop: CityProp): void {
    const { width: w, depth: d, height: h, variant } = prop
    const warm = variant === 1; const colors: readonly [string, string, string] = warm ? ['#4b4c3b', '#474c39', '#333e2e'] : ['#3c4c41', '#3b4b3e', '#2a3a32']
    p.box(0, 0, w + 7, d + 7, 6, ['#66705a', '#4c5846', '#394b3c'])
    p.box(0, 0, w, d, h, colors, 6)
    for (let z = 10; z < h; z += 9) {
      p.line([-w / 2, d / 2 + .1, z], [w / 2, d / 2 + .1, z], '#121e1940', .7)
      p.line([w / 2 + .1, -d / 2, z], [w / 2 + .1, d / 2, z], '#0e1b154d', .7)
      for (let x = -w / 2 + ((z % 18) ? 0 : 9); x < w / 2; x += 18) p.line([x, d / 2 + .2, z], [x, d / 2 + .2, z + 8], '#12211936', .6)
    }
    for (let z = 37; z < h - 6; z += 37) p.box(0, 0, w + 3, d + 3, 2, ['#66705b', '#59624e', '#405240'], z)
    const floors = Math.floor((h - 17) / 37)
    for (let floor = 0; floor < floors; floor++) {
      const z = 20 + floor * 37
      for (let col = 0; col < Math.floor((w - 16) / 29); col++) {
        const x = -w / 2 + 13 + col * 29; const lit = (floor * 5 + col * 3 + variant) % 7 === 0
        p.poly([[x - 2, d / 2 + 1, z - 2], [x + 15, d / 2 + 1, z - 2], [x + 15, d / 2 + 1, z + 22], [x - 2, d / 2 + 1, z + 22]], '#67715b')
        p.poly([[x, d / 2 + 2, z], [x + 13, d / 2 + 2, z], [x + 13, d / 2 + 2, z + 20], [x, d / 2 + 2, z + 20]], lit ? '#bcab6e' : '#112823')
        p.line([x + 6, d / 2 + 2.5, z], [x + 6, d / 2 + 2.5, z + 20], '#3a4432', 2)
        p.line([x, d / 2 + 2.5, z + 9], [x + 13, d / 2 + 2.5, z + 9], '#3a4432', 1.5)
        p.box(x + 6, d / 2 + 3, 19, 5, 2, ['#7c8064', '#525e49', '#3e503d'], z - 4)
      }
      for (let col = 0; col < Math.floor((d - 16) / 31); col++) {
        const y = -d / 2 + 13 + col * 31; const lit = (floor * 3 + col * 5 + variant) % 11 === 0
        p.poly([[w / 2 + 1, y - 2, z - 2], [w / 2 + 1, y + 15, z - 2], [w / 2 + 1, y + 15, z + 22], [w / 2 + 1, y - 2, z + 22]], '#4d5f4a')
        p.poly([[w / 2 + 2, y, z], [w / 2 + 2, y + 13, z], [w / 2 + 2, y + 13, z + 20], [w / 2 + 2, y, z + 20]], lit ? '#a69d65' : '#0d221d')
        p.line([w / 2 + 2.5, y + 6, z], [w / 2 + 2.5, y + 6, z + 20], '#35442f', 2)
        p.line([w / 2 + 2.5, y, z + 9], [w / 2 + 2.5, y + 13, z + 9], '#35442f', 1.5)
      }
    }
    p.box(0, 0, w + 5, d + 5, 5, ['#69715b', '#56614d', '#3f513f'], h + 6)
    p.tile(-w / 2 + 7, -d / 2 + 7, w - 14, d - 14, '#354438', h + 11)
    p.box(-w / 2 + 5, 0, 5, d, 7, ['#6e7760', '#4f5d48', '#435640'], h + 11)
    p.box(0, -d / 2 + 5, w, 5, 7, ['#6e7760', '#4f5d48', '#435640'], h + 11)
    p.box(w / 2 - 5, 0, 5, d, 7, ['#65725b', '#4f5d48', '#384b3a'], h + 11)
    p.box(0, d / 2 - 5, w, 5, 7, ['#65725b', '#4f5d48', '#384b3a'], h + 11)
    p.box(-22, -8, 32, 27, 15, ['#657060', '#4b5b4c', '#354a3d'], h + 11)
    for (let i = 0; i < 5; i++) p.line([-36 + i * 5, 7, h + 15], [-36 + i * 5, 7, h + 23], '#1c3229', 2)
    p.box(28, -32, 13, 15, 19, ['#6b6d58', '#4e5544', '#384838'], h + 11)
    p.tile(21, -39, 14, 15, '#172b23', h + 31)
    p.poly([[-14, d / 2 + 3, 6], [7, d / 2 + 3, 6], [7, d / 2 + 3, 32], [-14, d / 2 + 3, 32]], '#0b201b')
    p.box(-3, d / 2 + 6, 29, 10, 4, ['#72775c', '#4e5c47', '#3d513e'], 1)
    p.poly([[-20, d / 2 + 3, 34], [17, d / 2 + 3, 34], [17, d / 2 + 3, 42], [-20, d / 2 + 3, 42]], variant === 2 ? '#8b7553' : '#669876')
    p.line([-15, d / 2 + 4, 38], [11, d / 2 + 4, 38], '#c3e4a18c', 2)
    p.line([w / 2 - 5, d / 2 + 4, 0], [w / 2 - 5, d / 2 + 4, h + 6], '#253f32', 2)
  }

  private paintCar(p: IsoPainter, prop: CityProp): void {
    const { width: w, depth: d, variant } = prop
    const colors: readonly [string, string, string] = variant === 1 ? ['#92967b', '#717b65', '#536350'] : variant === 2 ? ['#805a48', '#654d3d', '#4b4032'] : ['#626e47', '#4c5939', '#35472e']
    for (const x of [-w * .4, w * .4]) for (const y of [-d * .33, d * .33]) p.box(x, y, 8, 11, 9, ['#202d24', '#0d1b14', '#0c1712'])
    p.box(0, 0, w, d, 10, colors, 6)
    const vertical = d > w
    const cw = vertical ? w - 6 : w * .42; const cd = vertical ? d * .42 : d - 6
    p.box(0, -3, cw, cd, 13, ['#536955', '#364f41', '#283f35'], 16)
    p.tile(-cw / 2 + 2, -cd / 2 - 1, cw - 4, cd - 4, '#718270', 30)
    p.poly([[-cw / 2 + 1, cd / 2 - 2, 18], [cw / 2 - 1, cd / 2 - 2, 18], [cw / 2 - 1, cd / 2 - 2, 27], [-cw / 2 + 1, cd / 2 - 2, 27]], '#203e36')
    p.line([0, cd / 2 - 1, 18], [0, cd / 2 - 1, 27], '#6e7c5d', 1)
    p.box(0, d / 2 + 1, w + 3, 3, 4, ['#858a6c', '#5f6a50', '#354931'], 4)
    for (const x of [-w * .3, w * .3]) p.box(x, d / 2 + 2, 6, 2, 3, ['#c9c089', '#c1b67b', '#6f7551'], 11)
    p.tile(-w * .25, d * .32, w * .45, 3, '#83906b', 17)
  }

  private paintCrate(p: IsoPainter, prop: CityProp): void {
    const { width: w, depth: d, height: h } = prop
    p.box(0, 0, w, d, h, ['#777357', '#5b6045', '#444f36'])
    p.box(0, 0, w + 2, d + 2, 3, ['#898164', '#727153', '#566044'], h - 3)
    for (const x of [-w / 2 + 3, w / 2 - 3]) p.line([x, d / 2 + .5, 1], [x, d / 2 + .5, h - 3], '#9a8e66', 2)
    p.line([-w / 2 + 3, d / 2 + 1, 3], [w / 2 - 3, d / 2 + 1, h - 5], '#999064', 2)
    p.line([w / 2 + 1, -d / 2 + 3, 2], [w / 2 + 1, d / 2 - 3, h - 3], '#737753', 2)
    p.line([-w / 2, 0, h + .5], [w / 2, 0, h + .5], '#424f34', 2)
  }

  private paintBarrier(p: IsoPainter, prop: CityProp): void {
    const { width: w, depth: d, height: h } = prop
    p.box(0, 0, w + 5, d + 5, 5, ['#8b8b6d', '#656f54', '#505e47'])
    p.box(0, 0, w, d, h, ['#a09a76', '#7e8160', '#596747'], 4)
    for (let x = -w / 2; x < w / 2 - 8; x += 16) p.poly([[x, d / 2 + 1, 7], [x + 7, d / 2 + 1, 7], [Math.min(w / 2, x + 15), d / 2 + 1, h], [x + 8, d / 2 + 1, h]], '#293a29')
  }

  private paintLamp(p: IsoPainter): void {
    p.box(0, 0, 8, 8, 5, ['#7b8267', '#55634c', '#3a503b'])
    p.box(0, 0, 3, 3, 80, ['#929579', '#6d795f', '#425740'], 5)
    p.line([0, 0, 85], [16, 0, 90], '#748067', 3)
    p.box(17, 0, 12, 6, 4, ['#899278', '#535f4b', '#3f513d'], 85)
    const ctx = p.ctx; const x = p.x(17, 0); const y = p.y(17, 0, 84)
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 20)
    glow.addColorStop(0, '#f7d889aa'); glow.addColorStop(.2, '#e9c87550'); glow.addColorStop(1, '#e9c87500')
    ctx.fillStyle = glow; ctx.fillRect(x - 20, y - 20, 40, 40)
    p.tile(12, -2, 9, 4, '#f5dca4', 85)
  }

  private paintBarrel(p: IsoPainter, variant: number): void {
    const ctx = p.ctx; const x = p.x(0, 0); const y = p.y(0, 0)
    ctx.fillStyle = variant ? '#725b40' : '#526946'; ctx.fillRect(x - 8, y - 24, 16, 24)
    ctx.beginPath(); ctx.ellipse(x, y - 24, 8, 4, 0, 0, Math.PI * 2); ctx.fillStyle = variant ? '#93805b' : '#80906a'; ctx.fill()
    ctx.strokeStyle = '#34482e'; ctx.lineWidth = 2
    for (const offset of [7, 19]) { ctx.beginPath(); ctx.ellipse(x, y - offset, 8, 3, 0, 0, Math.PI); ctx.stroke() }
    ctx.fillStyle = '#2c432e'; ctx.fillRect(x + 2, y - 26, 3, 2)
  }

  drawGround(ctx: CanvasRenderingContext2D, view: SceneView): void {
    const x = view.width / 2 + (view.cameraY - view.cameraX) * .86 * view.scale - this.groundOriginX * view.scale
    const y = view.height / 2 - (view.cameraX + view.cameraY) * .47 * view.scale - this.groundOriginY * view.scale
    ctx.drawImage(this.ground, x, y, this.ground.width * view.scale, this.ground.height * view.scale)
  }

  drawProp(ctx: CanvasRenderingContext2D, prop: CityProp, view: SceneView, player: Vec2): void {
    const x = view.width / 2 + (prop.x - view.cameraX - prop.y + view.cameraY) * .86 * view.scale
    const y = view.height / 2 + (prop.x - view.cameraX + prop.y - view.cameraY) * .47 * view.scale
    const left = x - prop.anchorX * view.scale; const top = y - prop.anchorY * view.scale
    const width = prop.image.width * view.scale; const height = prop.image.height * view.scale
    if (left > view.width || left + width < 0 || top > view.height || top + height < 0) return
    const playerX = view.width / 2 + (player.x - view.cameraX - player.y + view.cameraY) * .86 * view.scale
    const playerY = view.height / 2 + (player.x - view.cameraX + player.y - view.cameraY) * .47 * view.scale
    const obscuresPlayer = prop.kind === 'building' && player.x + player.y < prop.sortDepth && playerX > left + 30 * view.scale && playerX < left + width - 30 * view.scale && playerY > top + 30 * view.scale && playerY < top + height - 35 * view.scale
    if (obscuresPlayer) ctx.globalAlpha = .48
    ctx.drawImage(prop.image, Math.round(left), Math.round(top), width, height)
    ctx.globalAlpha = 1
  }

  drawPlayerLight(ctx: CanvasRenderingContext2D, view: SceneView, player: Vec2): void {
    const x = view.width / 2 + (player.x - view.cameraX - player.y + view.cameraY) * .86 * view.scale
    const y = view.height / 2 + (player.x - view.cameraX + player.y - view.cameraY) * .47 * view.scale
    ctx.drawImage(this.light, x - 80 * view.scale, y - 50 * view.scale, 160 * view.scale, 100 * view.scale)
  }

  drawRain(ctx: CanvasRenderingContext2D, view: SceneView, time: number): void {
    ctx.strokeStyle = '#b6c8b516'; ctx.lineWidth = .7; ctx.beginPath()
    for (let i = 0; i < 65; i++) {
      const x = ((i * 137.37 + time * 29) % (view.width + 40)) - 20
      const y = ((i * 79.53 + time * 240) % (view.height + 30)) - 15
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9)
    }
    ctx.stroke()
  }

  resolve(entity: Vec2, radius: number, target?: Vec2, step = 0): void {
    for (const prop of this.props) {
      if (!prop.solid) continue
      const left = prop.x - prop.width / 2; const right = prop.x + prop.width / 2
      const top = prop.y - prop.depth / 2; const bottom = prop.y + prop.depth / 2
      const closeX = clamp(entity.x, left, right); const closeY = clamp(entity.y, top, bottom)
      let dx = entity.x - closeX; let dy = entity.y - closeY; const sq = dx * dx + dy * dy
      if (sq >= radius * radius) continue
      if (sq === 0) {
        const sides = [entity.x - left, right - entity.x, entity.y - top, bottom - entity.y]
        const nearest = Math.min(...sides)
        if (sides[0] === nearest) { entity.x = left - radius; dx = -1 }
        else if (sides[1] === nearest) { entity.x = right + radius; dx = 1 }
        else if (sides[2] === nearest) { entity.y = top - radius; dy = -1 }
        else { entity.y = bottom + radius; dy = 1 }
      } else {
        const length = Math.sqrt(sq); const overlap = radius - length + .1
        dx /= length; dy /= length; entity.x += dx * overlap; entity.y += dy * overlap
      }
      if (target && step > 0) {
        if (Math.abs(dx) > Math.abs(dy)) entity.y += (target.y > top && target.y < bottom ? (entity.y < prop.y ? -1 : 1) : Math.sign(target.y - entity.y)) * step
        else entity.x += (target.x > left && target.x < right ? (entity.x < prop.x ? -1 : 1) : Math.sign(target.x - entity.x)) * step
      }
    }
    entity.x = clamp(entity.x, radius, 1200 - radius); entity.y = clamp(entity.y, radius, 1200 - radius)
  }
}
