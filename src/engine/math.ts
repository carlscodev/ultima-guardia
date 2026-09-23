export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const lerpFactor = (sharpness: number, dt: number): number =>
  1 - Math.exp(-sharpness * dt)

export const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min)

export const distanceSquared = (ax: number, az: number, bx: number, bz: number): number => {
  const x = ax - bx
  const z = az - bz
  return x * x + z * z
}
