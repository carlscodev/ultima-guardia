/** Compose a complete, opaque frame offscreen, then present it in one draw.
 * Never request desynchronized/front-buffer rendering: Android scanout can show
 * the clear and individual draw calls as torn stripes while combat is painting.
 */
export class FrameRenderer {
  readonly buffer = document.createElement('canvas')
  readonly context: CanvasRenderingContext2D
  readonly display: CanvasRenderingContext2D
  width = 1
  height = 1
  scale = 1
  frames = 0
  private lost = false
  private smooth = false
  constructor(readonly canvas: HTMLCanvasElement) {
    const options: CanvasRenderingContext2DSettings = { alpha: false, desynchronized: false }
    const display = canvas.getContext('2d', options)
    const context = this.buffer.getContext('2d', options)
    if (!display || !context) throw new Error('Canvas2D no disponible')
    this.display = display
    this.context = context
    canvas.addEventListener('contextlost', this.onLost)
    canvas.addEventListener('contextrestored', this.onRestored)
  }
  private onLost = (event: Event) => { event.preventDefault(); this.lost = true }
  private onRestored = () => { this.lost = false; this.present() }
  resize(cssWidth: number, cssHeight: number, requestedScale: number, smooth: boolean): void {
    // Both dimensions use ONE scale. Independently clamping width stretched portrait frames.
    this.scale = Math.max(.25, Math.min(requestedScale, 1440 / cssWidth, 1100 / cssHeight))
    const width = Math.max(1, Math.round(cssWidth * this.scale))
    const height = Math.max(1, Math.round(cssHeight * this.scale))
    if (this.buffer.width !== width || this.buffer.height !== height) {
      this.buffer.width = width
      this.buffer.height = height
    }
    this.width = width; this.height = height; this.smooth = smooth
    // Keep the visible surface native-sized; no CSS pixelated transform on a live low-latency surface.
    const density = Math.min(window.devicePixelRatio || 1, 2, 2000 / cssWidth, 2000 / cssHeight)
    const displayWidth = Math.round(cssWidth * density), displayHeight = Math.round(cssHeight * density)
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth; this.canvas.height = displayHeight
    }
    this.context.imageSmoothingEnabled = smooth
    this.context.imageSmoothingQuality = 'medium'
    this.canvas.style.imageRendering = 'auto'
  }
  begin(): void {
    // Defend against a stale effect transform/alpha leaking into the next frame.
    const c = this.context
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalAlpha = 1
    c.globalCompositeOperation = 'source-over'
    c.filter = 'none'
    c.shadowBlur = 0
  }
  present(): void {
    if (this.lost || !this.buffer.width || !this.buffer.height) return
    const c = this.display
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.globalAlpha = 1
    c.globalCompositeOperation = 'source-over'
    c.imageSmoothingEnabled = this.smooth
    c.imageSmoothingQuality = 'medium'
    // No clearRect, partial actors, rain or effects are ever drawn on the visible canvas.
    c.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height)
    this.frames++
  }
  dispose(): void {
    this.canvas.removeEventListener('contextlost', this.onLost)
    this.canvas.removeEventListener('contextrestored', this.onRestored)
    this.buffer.width = this.buffer.height = 1
  }
}
