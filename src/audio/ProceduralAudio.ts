export class ProceduralAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private noiseBuffer: AudioBuffer | null = null

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = 0.28
      this.filter = this.context.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.value = 18000
      this.filter.connect(this.master).connect(this.context.destination)
      this.noiseBuffer = this.createNoiseBuffer(this.context)
    }
    await this.context.resume()
  }

  setMuffled(active: boolean): void {
    if (!this.context || !this.filter) return
    this.filter.frequency.cancelScheduledValues(this.context.currentTime)
    this.filter.frequency.exponentialRampToValueAtTime(active ? 700 : 18000, this.context.currentTime + 0.12)
  }

  shot(shotgun: boolean): void {
    if (!this.context || !this.filter || !this.noiseBuffer) return
    const now = this.context.currentTime
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    const band = this.context.createBiquadFilter()
    source.buffer = this.noiseBuffer
    band.type = 'bandpass'; band.frequency.value = shotgun ? 620 : 1200; band.Q.value = 0.75
    gain.gain.setValueAtTime(shotgun ? 0.8 : 0.42, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + (shotgun ? 0.16 : 0.07))
    source.connect(band).connect(gain).connect(this.filter)
    source.start(now); source.stop(now + 0.2)
  }

  impact(): void { this.tone(120, 48, 0.06, 0.08) }
  pulse(): void { this.tone(160, 38, 0.45, 0.35) }
  roar(distanceRatio: number): void { this.tone(72, 41, 0.35, 0.05 * (1 - distanceRatio)) }

  private tone(from: number, to: number, duration: number, volume: number): void {
    if (!this.context || !this.filter) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(from, now)
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    oscillator.connect(gain).connect(this.filter)
    oscillator.start(now); oscillator.stop(now + duration)
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = context.sampleRate
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) channel[i] = Math.random() * 2 - 1
    return buffer
  }

  dispose(): void { void this.context?.close(); this.context = null }
}
