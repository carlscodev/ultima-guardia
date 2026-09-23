export type GameMode = 'campaign' | 'infinite'
/** Deterministic mission progression, independent of rendering, audio, and wall clock. */
export class Campaign {
  wave = 0
  phase: 'combat' | 'extract' | 'complete' = 'combat'
  extraction = 0
  readonly extractionPoint = { x: 3030, y: 600 }
  constructor(public mode: GameMode = 'campaign') {}
  reset(mode: GameMode): void { this.mode = mode; this.wave = 0; this.phase = 'combat'; this.extraction = 0 }
  next(): boolean {
    if (this.mode === 'campaign' && this.wave >= 10) { this.phase = 'extract'; return false }
    this.wave++; return true
  }
  get final(): boolean { return this.mode === 'campaign' && this.wave === 10 }
  tickExtraction(dt: number, x: number, y: number): boolean {
    if (this.phase !== 'extract') return false
    const inside = Math.hypot(x - this.extractionPoint.x, y - this.extractionPoint.y) < 72
    this.extraction = inside ? Math.min(4, this.extraction + dt) : 0
    if (this.extraction >= 4) { this.phase = 'complete'; return true }
    return false
  }
}
