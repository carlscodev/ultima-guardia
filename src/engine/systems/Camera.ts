export class Camera {
  x = 600; y = 600; zoom = 1
  update(dt: number, x: number, y: number, aimX: number, aimY: number, cinematic = false): void {
    const length = Math.hypot(aimX, aimY) || 1
    const follow = 1 - Math.exp(-5 * dt)
    this.x += (x + aimX / length * 25 - this.x) * follow
    this.y += (y + aimY / length * 25 - this.y) * follow
    this.zoom += ((cinematic ? 1.035 : 1) - this.zoom) * follow
  }
  reset(x: number, y: number): void { this.x = x; this.y = y; this.zoom = 1 }
}
