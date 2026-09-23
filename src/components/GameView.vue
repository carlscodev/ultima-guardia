<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
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
const ready = ref(false)
const muted = ref(false)
const fullscreen = ref(false)
const notice = ref('')
const controls = useControls()
const hud = useHudStore()
let engine: GameEngine | null = null
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const playingUi = computed(() => screen.value === 'playing')
const focusCanvas = (): void => { void nextTick(() => canvas.value?.focus({ preventScroll: true })) }
const start = (): void => { if (!ready.value) return; controls.clear(); engine?.start(); focusCanvas() }
const pause = (): void => { engine?.togglePause(); if (screen.value === 'playing') focusCanvas() }
const choose = (upgrade: IUpgrade): void => { engine?.chooseUpgrade(upgrade); focusCanvas() }
const weapon = (kind: WeaponKind): void => { controls.queueWeapon(kind); focusCanvas() }
const pulse = (): void => { controls.queuePulse(); focusCanvas() }
const menu = (): void => { engine?.returnToMenu(); upgrades.value = [] }
const toggleSound = (): void => { muted.value = !muted.value; engine?.setMuted(muted.value); if (screen.value === 'playing') focusCanvas() }
const showNotice = (message: string): void => { notice.value = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.value = '' }, 5000) }
const fullscreenChange = (): void => { fullscreen.value = Boolean(document.fullscreenElement); engine?.resize() }
const toggleFullscreen = async (): Promise<void> => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
    else showNotice('La pantalla completa no está disponible en este navegador.')
  } catch { showNotice('La vista previa no permite pantalla completa. Puedes jugar normalmente.') }
}
const keyboardShortcuts = (event: KeyboardEvent): void => {
  if (event.isComposing || event.keyCode === 229 || event.repeat) return
  if (document.querySelector('.briefing[open]')) return
  const key = event.key.toLowerCase()
  if (key === 'p' || (key === 'escape' && screen.value === 'playing')) { event.preventDefault(); pause() }
  if (key === 'enter' && screen.value === 'menu' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); start() }
}
const visibility = (): void => { if (document.hidden && screen.value === 'playing') pause() }
const resize = (): void => engine?.resize()

onMounted(() => {
  if (!canvas.value) return
  try {
    engine = new GameEngine(canvas.value, controls.state, {
      onHud: hud.publish,
      onScreen: (next) => { screen.value = next; if (next !== 'playing') controls.clear() },
      onUpgrades: (next) => { upgrades.value = next },
    })
    ready.value = true
  } catch { showNotice('No se pudo iniciar Canvas 2D. Prueba un navegador compatible con aceleración gráfica.') }
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('keydown', keyboardShortcuts)
  document.addEventListener('visibilitychange', visibility)
  document.addEventListener('fullscreenchange', fullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', keyboardShortcuts)
  document.removeEventListener('visibilitychange', visibility)
  document.removeEventListener('fullscreenchange', fullscreenChange)
  clearTimeout(noticeTimer)
  engine?.dispose(); engine = null
})
</script>

<template>
  <main class="game-shell" :data-screen="screen" :data-ready="ready">
    <canvas ref="canvas" tabindex="0" aria-label="Última Guardia, juego de supervivencia zombi 2D" aria-describedby="game-instructions" />
    <p id="game-instructions" class="sr-only">Muévete con WASD, flechas o el joystick táctil. Disparo automático. Espacio: pulso. 1 y 2: cambiar arma. P o Escape: pausa.</p>
    <div v-if="screen !== 'menu'" class="game-texture" aria-hidden="true" />
    <template v-if="playingUi">
      <HudOverlay :state="hud.state.value" :muted="muted" @weapon="weapon" @pause="pause" @sound="toggleSound" />
      <VirtualControls :cooldown="hud.state.value.pulseCooldown" @move="controls.setJoystick" @release="controls.releaseJoystick" @pulse="pulse" />
    </template>
    <UpgradeMenu v-if="screen === 'levelup'" :upgrades="upgrades" :level="hud.state.value.level" @choose="choose" />
    <GameOverlay :screen="screen" :state="hud.state.value" :muted="muted" :fullscreen="fullscreen" :ready="ready" @start="start" @resume="pause" @menu="menu" @sound="toggleSound" @fullscreen="toggleFullscreen" />
    <div v-if="notice" class="notice" role="status">{{ notice }}</div>
  </main>
</template>

<style scoped>
.game-shell, canvas { position: fixed; inset: 0; width: 100%; height: 100%; }
.game-shell { background: var(--background); }
canvas { display: block; outline: 0; touch-action: none; image-rendering: pixelated; }
.game-texture { position: fixed; z-index: 2; inset: 0; pointer-events: none; opacity: .12; background: repeating-linear-gradient(0deg, transparent 0 3px, #050c0920 3px 4px); }
.notice { position: fixed; z-index: 40; bottom: 25px; left: 50%; transform: translateX(-50%); max-width: min(430px, 90%); width: max-content; padding: 15px 20px; border: 1px solid #c2eb8940; background: #152018f5; box-shadow: 0 8px 30px #0008; color: var(--foreground); font-size: 12px; line-height: 1.7; text-align: center; }
</style>
