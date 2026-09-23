<script setup lang="ts">
import { ref } from 'vue'

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
  pointerId = event.pointerId
  stick.value?.setPointerCapture(pointerId)
  move(event)
}
const release = (event: PointerEvent): void => {
  if (event.pointerId !== pointerId) return
  pointerId = null; knobX.value = 0; knobY.value = 0; emit('release')
}
</script>

<template>
  <div ref="stick" class="stick" @pointerdown="down" @pointermove="move" @pointerup="release" @pointercancel="release">
    <div class="rings" /><div class="knob" :style="{ transform: `translate(${knobX}px,${knobY}px)` }"><i /></div>
  </div>
  <button class="pulse" :disabled="props.cooldown > 0" @pointerdown.prevent="emit('pulse')">
    <span>◎</span><b>{{ props.cooldown > 0 ? Math.ceil(props.cooldown) : 'PULSO' }}</b>
  </button>
</template>

<style scoped>
.stick{position:fixed;z-index:5;left:max(22px,env(safe-area-inset-left));bottom:max(25px,env(safe-area-inset-bottom));width:126px;height:126px;border:1px solid #bfe6d22b;border-radius:50%;background:#0a17184f;box-shadow:inset 0 0 30px #0008;touch-action:none}.rings{position:absolute;inset:18px;border:1px dashed #c3ebd525;border-radius:50%}.knob{position:absolute;left:36px;top:36px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#c8f0d35c,#6e91852d);border:1px solid #d9fae08c;box-shadow:0 5px 20px #0008;pointer-events:none}.knob i{position:absolute;inset:21px;border:1px solid #e5fbe5;border-radius:50%}.pulse{position:fixed;z-index:5;right:max(26px,env(safe-area-inset-right));bottom:max(30px,env(safe-area-inset-bottom));width:92px;height:92px;border-radius:50%;border:1px solid #bdf485;background:radial-gradient(circle,#1f392fcc,#091512e8);color:#d7ffb5;box-shadow:0 0 0 8px #bff98b0a,0 0 30px #9cf76018;touch-action:none}.pulse span{display:block;font-size:31px;line-height:34px}.pulse b{font-size:9px;letter-spacing:1.3px}.pulse:disabled{filter:grayscale(1);opacity:.5}@media(pointer:fine){.stick{opacity:.28}.stick:hover{opacity:1}}@media(max-height:550px){.stick{width:100px;height:100px}.knob{left:28px;top:28px;width:44px;height:44px}.knob i{inset:18px}.pulse{width:76px;height:76px}}
</style>
