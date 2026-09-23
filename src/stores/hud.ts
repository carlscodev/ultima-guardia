import { readonly, shallowRef } from 'vue'
import type { GameState } from '@/types/game'

const initial: GameState = {
  screen: 'menu', hp: 100, maxHp: 100, xp: 0, xpNeeded: 5, level: 1,
  wave: 0, kills: 0, elapsed: 0, pulseCooldown: 0, weapon: 'rifle', enemies: 0, fps: 60,
}

const hud = shallowRef<GameState>(initial)

export function useHudStore() {
  const publish = (next: Readonly<GameState>): void => { hud.value = { ...next } }
  return { state: readonly(hud), publish }
}
