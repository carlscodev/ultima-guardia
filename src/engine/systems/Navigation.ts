export interface Point { x: number; y: number }
export interface Obstacle extends Point { width: number; depth: number; solid: boolean }
/** Small static navigation grid shared by companions. Paths are recalculated at 2Hz, not per frame. */
export class Navigation {
  readonly cell = 24
  readonly cols: number
  readonly rows: number
  readonly blocked: Uint8Array
  constructor(readonly width: number, readonly height: number, obstacles: readonly Obstacle[]) {
    this.cols = Math.ceil(width / this.cell); this.rows = Math.ceil(height / this.cell)
    this.blocked = new Uint8Array(this.cols * this.rows)
    for (const p of obstacles) if (p.solid) {
      const l = Math.max(0, Math.floor((p.x - p.width / 2 - 10) / this.cell)); const r = Math.min(this.cols - 1, Math.floor((p.x + p.width / 2 + 10) / this.cell))
      const t = Math.max(0, Math.floor((p.y - p.depth / 2 - 10) / this.cell)); const b = Math.min(this.rows - 1, Math.floor((p.y + p.depth / 2 + 10) / this.cell))
      for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) this.blocked[y * this.cols + x] = 1
    }
  }
  private index(p: Point): number { return Math.max(0, Math.min(this.rows - 1, Math.floor(p.y / this.cell))) * this.cols + Math.max(0, Math.min(this.cols - 1, Math.floor(p.x / this.cell))) }
  private free(index: number): number {
    if (!this.blocked[index]) return index
    const x = index % this.cols; const y = Math.floor(index / this.cols)
    for (let r = 1; r < 20; r++) for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
      const nx = x + ox; const ny = y + oy
      if (nx >= 0 && ny >= 0 && nx < this.cols && ny < this.rows && !this.blocked[ny * this.cols + nx]) return ny * this.cols + nx
    }
    return index
  }
  path(from: Point, to: Point): Point[] {
    const start = this.free(this.index(from)); const end = this.free(this.index(to))
    if (start === end) return [this.point(end)]
    const parents = new Int32Array(this.blocked.length); parents.fill(-1)
    const queue = new Int32Array(this.blocked.length); queue[0] = start; parents[start] = start
    let read = 0; let write = 1
    while (read < write && parents[end] === -1) {
      const at = queue[read++]!; const x = at % this.cols; const y = Math.floor(at / this.cols)
      for (const [ox, oy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + ox!; const ny = y + oy!
        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue
        const n = ny * this.cols + nx
        if (parents[n] !== -1 || this.blocked[n]) continue
        parents[n] = at; queue[write++] = n
      }
    }
    if (parents[end] === -1) return []
    const result: Point[] = []; let at = end
    while (at !== start) { result.push(this.point(at)); at = parents[at]! }
    return result.reverse()
  }
  private point(i: number): Point { return { x: (i % this.cols + .5) * this.cell, y: (Math.floor(i / this.cols) + .5) * this.cell } }
}
