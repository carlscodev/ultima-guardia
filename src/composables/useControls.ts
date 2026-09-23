import { onBeforeUnmount, onMounted } from 'vue'
import type { InputState, WeaponKind } from '@/types/game'

export interface ControlsApi {
  readonly state: InputState
  setJoystick: (x: number, y: number) => void
  releaseJoystick: () => void
  queuePulse: () => void
  queueWeapon: (weapon: WeaponKind) => void
  clear: () => void
}

export function useControls(): ControlsApi {
  const keys = new Set<string>()
  const state: InputState = { moveX: 0, moveY: 0, pulseQueued: false, weaponQueued: null }
  let joystickX = 0
  let joystickY = 0

  const recalculate = (): void => {
    const keyboardX = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'))
    const keyboardY = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
    state.moveX = Math.max(-1, Math.min(1, keyboardX + joystickX))
    state.moveY = Math.max(-1, Math.min(1, keyboardY + joystickY))
  }
  const keydown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase()
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', '1', '2'].includes(key)) event.preventDefault()
    keys.add(key)
    if (key === ' ' && !event.repeat) state.pulseQueued = true
    if (key === '1') state.weaponQueued = 'rifle'
    if (key === '2') state.weaponQueued = 'shotgun'
    recalculate()
  }
  const keyup = (event: KeyboardEvent): void => { keys.delete(event.key.toLowerCase()); recalculate() }
  const clear = (): void => {
    keys.clear(); joystickX = 0; joystickY = 0
    state.moveX = 0; state.moveY = 0; state.pulseQueued = false; state.weaponQueued = null
  }

  onMounted(() => {
    window.addEventListener('keydown', keydown, { passive: false })
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clear)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', clear)
  })

  return {
    state,
    setJoystick: (x, y) => { joystickX = x; joystickY = y; recalculate() },
    releaseJoystick: () => { joystickX = 0; joystickY = 0; recalculate() },
    queuePulse: () => { state.pulseQueued = true },
    queueWeapon: (weapon) => { state.weaponQueued = weapon },
    clear,
  }
}
