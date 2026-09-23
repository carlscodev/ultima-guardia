<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { GameEngine } from '@/engine/GameEngine'
import { useControls } from '@/composables/useControls'
import { useHudStore } from '@/stores/hud'
import type { IUpgrade, ScreenState, WeaponKind } from '@/types/game'
import HudOverlay from '@/components/hud/HudOverlay.vue'
import VirtualControls from '@/components/hud/VirtualControls.vue'
import UpgradeMenu from '@/components/hud/UpgradeMenu.vue'
import GameOverlay from '@/components/GameOverlay.vue'

const canvas = ref<HTMLCanvasElement | null>(null)
const screen = ref<ScreenState>('menu')
const upgrades = shallowRef<readonly IUpgrade[]>([])
const controls = useControls()
const hud = useHudStore()
let engine: GameEngine | null = null

const playingUi = computed(() => screen.value === 'playing')
const start = (): void => { void engine?.start() }
const pause = (): void => engine?.togglePause()
const choose = (upgrade: IUpgrade): void => engine?.chooseUpgrade(upgrade)
const weapon = (kind: WeaponKind): void => controls.queueWeapon(kind)
const keyboardPause = (event: KeyboardEvent): void => { if (event.key.toLowerCase() === 'p' && !event.repeat) pause() }
const visibility = (): void => { if (document.hidden && screen.value === 'playing') pause() }
const resize = (): void => engine?.resize()

onMounted(() => {
  if (!canvas.value) return
  engine = new GameEngine(canvas.value, controls.state, {
    onHud: hud.publish,
    onScreen: (next) => { screen.value = next; if (next !== 'playing') controls.clear() },
    onUpgrades: (next) => { upgrades.value = next },
  })
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('keydown', keyboardPause)
  document.addEventListener('visibilitychange', visibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', keyboardPause)
  document.removeEventListener('visibilitychange', visibility)
  engine?.dispose(); engine = null
})
</script>

<template>
  <main class="game-shell">
    <canvas ref="canvas" aria-label="Última Guardia, juego de supervivencia zombi 2D" />
    <div class="grain" />
    <template v-if="playingUi">
      <HudOverlay :state="hud.state.value" @weapon="weapon" @pause="pause" />
      <VirtualControls :cooldown="hud.state.value.pulseCooldown" @move="controls.setJoystick" @release="controls.releaseJoystick" @pulse="controls.queuePulse" />
    </template>
    <UpgradeMenu v-if="screen === 'levelup'" :upgrades="upgrades" @choose="choose" />
    <GameOverlay :screen="screen" :state="hud.state.value" @start="start" @resume="pause" />
  </main>
</template>

<style scoped>
.game-shell,canvas{position:fixed;inset:0;width:100%;height:100%}canvas{display:block;outline:0}.grain{position:fixed;z-index:2;inset:-50%;pointer-events:none;opacity:.045;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");animation:grain .18s steps(2) infinite}@keyframes grain{0%{transform:translate(0)}25%{transform:translate(3%,-2%)}50%{transform:translate(-2%,3%)}75%{transform:translate(2%,2%)}100%{transform:translate(-3%,-2%)}}
</style>
