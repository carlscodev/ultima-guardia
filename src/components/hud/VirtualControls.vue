<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { ChevronUp, Move, Zap } from '@lucide/vue'

const props = defineProps<{ cooldown: number }>()
const emit = defineEmits<{ move: [x: number, y: number]; release: []; pulse: [] }>()
const stick = ref<HTMLElement | null>(null)
const knobX = ref(0)
const knobY = ref(0)
let pointerId: number | null = null

const move = (event: PointerEvent): void => {
  if (event.pointerId !== pointerId || !stick.value) return
  const rect = stick.value.getBoundingClientRect()
  let x = event.clientX - rect.left - rect.width / 2
  let y = event.clientY - rect.top - rect.height / 2
  const max = rect.width * 0.31
  const length = Math.hypot(x, y)
  if (length > max) { x *= max / length; y *= max / length }
  knobX.value = x; knobY.value = y; emit('move', x / max, y / max)
}
const down = (event: PointerEvent): void => {
  if (pointerId !== null) return
  event.preventDefault()
  pointerId = event.pointerId
  stick.value?.setPointerCapture(pointerId)
  move(event)
}
const release = (event: PointerEvent): void => {
  if (event.pointerId !== pointerId) return
  pointerId = null; knobX.value = 0; knobY.value = 0; emit('release')
}
onBeforeUnmount(() => emit('release'))
</script>

<template>
  <div ref="stick" class="stick" role="group" aria-label="Joystick de movimiento" @pointerdown="down" @pointermove="move" @pointerup="release" @pointercancel="release" @lostpointercapture="release">
    <div class="rings" /><ChevronUp class="direction up" /><ChevronUp class="direction right" /><ChevronUp class="direction down" /><ChevronUp class="direction left" /><div class="knob" :style="{ transform: `translate(${knobX}px,${knobY}px)` }"><Move :size="19" /></div>
  </div>
  <div class="keyboard-hint" aria-hidden="true"><div class="key-grid"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div><span>MANTENTE<br /><strong>EN MOVIMIENTO</strong></span></div>
  <div class="pulse-control">
    <div class="pulse-ring" :style="{ '--charge': `${Math.max(0, 1 - props.cooldown / 9) * 100}%` }"><button class="pulse" :disabled="props.cooldown > 0" :aria-label="props.cooldown > 0 ? `Pulso defensivo, recargando: ${Math.ceil(props.cooldown)} segundos` : 'Activar pulso defensivo'" @click="emit('pulse')"><Zap :size="28" :stroke-width="1.4" /><b>{{ props.cooldown > 0 ? `${Math.ceil(props.cooldown)} s` : 'PULSO' }}</b></button></div>
    <kbd class="pulse-key">ESPACIO</kbd>
  </div>
</template>

<style scoped>
.stick { position: fixed; z-index: 5; left: max(23px, env(safe-area-inset-left)); bottom: max(109px, calc(env(safe-area-inset-bottom) + 90px)); width: 118px; height: 118px; border: 1px solid #b3caa33d; border-radius: 50%; background: #0c15117d; box-shadow: inset 0 0 25px #0003; touch-action: none; user-select: none; }
.rings { position: absolute; inset: 17px; border: 1px dashed #b3caa326; border-radius: 50%; pointer-events: none; }
.knob { position: absolute; left: calc(50% - 23px); top: calc(50% - 23px); width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; background: #3a4a31bf; border: 1px solid #c2ddaa70; color: #c7d9b7; box-shadow: 0 5px 15px #0005; pointer-events: none; }
.direction { position: absolute; width: 11px; height: 11px; color: #93a283; pointer-events: none; }.up { top: 5px; left: calc(50% - 5.5px); }.right { top: calc(50% - 5.5px); right: 5px; transform: rotate(90deg); }.down { bottom: 5px; left: calc(50% - 5.5px); transform: rotate(180deg); }.left { left: 5px; top: calc(50% - 5.5px); transform: rotate(-90deg); }
.pulse-control { position: fixed; z-index: 5; right: max(36px, env(safe-area-inset-right)); bottom: max(35px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.pulse-ring { padding: 3px; border-radius: 50%; background: conic-gradient(var(--accent) var(--charge), #40513c var(--charge)); box-shadow: 0 0 0 5px #c2eb8907; }
.pulse { width: 81px; height: 81px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 7px; border-radius: 50%; border: 4px solid #0c1511; background: #203020; color: var(--accent); touch-action: manipulation; }
.pulse b { font-size: 8px; letter-spacing: 1.6px; font-weight: 500; }.pulse:disabled { background: #142017; color: #8e9f7f; }.pulse:hover:not(:disabled) { background: #304a29; }
.pulse-key { color: #c2ccba; font-size: 7px; letter-spacing: 1.5px; background: #0c1511c2; border: 1px solid var(--border); padding: 4px 8px; border-radius: 2px; }
.keyboard-hint { position: fixed; z-index: 4; left: 32px; bottom: 35px; display: flex; align-items: center; gap: 15px; pointer-events: none; }
.key-grid { display: flex; flex-direction: column; align-items: center; gap: 4px; }.key-grid > div { display: flex; gap: 4px; }.key-grid kbd { display: grid; place-items: center; width: 21px; height: 21px; border: 1px solid #b5c0ab4d; border-radius: 2px; background: #0c1511cc; color: #c1ceb6; font-size: 8px; }.keyboard-hint > span { color: #9ca88e; font-size: 7px; line-height: 1.9; letter-spacing: 1.2px; text-shadow: 0 1px 4px #000; }.keyboard-hint strong { font-weight: 500; color: #c0cbb4; }
@media (pointer: fine) { .stick { display: none; } }
@media (pointer: coarse), (max-width: 700px) { .keyboard-hint, .pulse-key { display: none; }.pulse-control { bottom: max(125px, calc(env(safe-area-inset-bottom) + 100px)); right: 27px; }.pulse { width: 77px; height: 77px; } }
@media (max-height: 520px) { .stick { width: 98px; height: 98px; bottom: 25px; }.pulse-control { bottom: 29px; right: 24px; }.pulse { width: 65px; height: 65px; }.pulse-key { display: none; }.keyboard-hint { left: 24px; bottom: 28px; } }
</style>
