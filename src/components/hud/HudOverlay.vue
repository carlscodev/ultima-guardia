<script setup lang="ts">
import type { GameState, WeaponKind } from '@/types/game'

defineProps<{ state: Readonly<GameState> }>()
const emit = defineEmits<{ weapon: [weapon: WeaponKind]; pause: [] }>()
const time = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
</script>

<template>
  <header class="hud" aria-live="polite">
    <section class="vitals glass">
      <div class="micro"><span class="live-dot" /> OPERADOR 01 <b>NIV. {{ state.level }}</b></div>
      <div class="bar health"><i :style="{ transform: `scaleX(${Math.max(0, state.hp / state.maxHp)})` }" /></div>
      <div class="row"><strong>{{ Math.ceil(state.hp) }} / {{ state.maxHp }}</strong><span>INTEGRIDAD</span></div>
      <div class="bar xp"><i :style="{ transform: `scaleX(${state.xp / state.xpNeeded})` }" /></div>
    </section>

    <button class="pause glass" aria-label="Pausar" @click="emit('pause')">Ⅱ</button>

    <section class="mission glass">
      <div class="micro">CUARENTENA // DISTRITO 09</div>
      <strong>OLEADA {{ state.wave.toString().padStart(2, '0') }}</strong>
      <div>{{ state.kills }} BAJAS <i /> {{ time(state.elapsed) }} <i /> {{ state.enemies }} HOSTILES</div>
    </section>
  </header>
  <nav class="weapons glass" aria-label="Cambiar arma">
    <button :class="{ active: state.weapon === 'rifle' }" @click="emit('weapon', 'rifle')"><kbd>1</kbd> RIFLE</button>
    <button :class="{ active: state.weapon === 'shotgun' }" @click="emit('weapon', 'shotgun')"><kbd>2</kbd> ESCOPETA</button>
  </nav>
  <div class="telemetry">{{ state.fps }} FPS · SIM 60HZ</div>
</template>

<style scoped>
.hud{position:fixed;z-index:4;top:max(16px,env(safe-area-inset-top));left:18px;right:18px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}.glass{background:linear-gradient(135deg,#0b1718cc,#13221eb3);border:1px solid #c7f1d525;box-shadow:0 10px 35px #0008,inset 0 1px #fff1;backdrop-filter:blur(12px)}.vitals,.mission{padding:12px 14px;width:min(310px,39vw)}.micro{color:#8ea6a0;font-size:9px;letter-spacing:1.7px}.micro b{float:right;color:#d8f9a2}.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#bff687;box-shadow:0 0 10px #bff687;margin-right:5px}.bar{height:5px;background:#182b29;margin:9px 0 5px;overflow:hidden}.bar i{display:block;width:100%;height:100%;transform-origin:left;transition:transform .15s}.health i{background:linear-gradient(90deg,#78d57e,#d5fa91);box-shadow:0 0 12px #a7ed7c}.xp{height:2px;margin-top:8px}.xp i{background:#78dfe2}.row{display:flex;justify-content:space-between;font-size:10px}.row span{color:#78908a;letter-spacing:1.2px}.mission{text-align:right}.mission>strong{display:block;font:800 clamp(18px,2.5vw,27px)/1.3 'Arial Narrow',sans-serif;letter-spacing:1px}.mission>div{font-size:9px;color:#96aaa5;letter-spacing:1px}.mission i{display:inline-block;width:3px;height:3px;background:#b5dc92;margin:0 5px}.pause{pointer-events:auto;color:#d9eee6;border-radius:2px;width:38px;height:34px}.weapons{position:fixed;z-index:5;left:50%;bottom:22px;transform:translateX(-50%);display:flex;padding:4px;gap:4px}.weapons button{border:0;background:transparent;color:#71857f;padding:7px 12px;font-size:9px;letter-spacing:1px}.weapons button.active{color:#dcf7cf;background:#b8ef8d14}.weapons kbd{color:inherit;border:1px solid currentColor;padding:1px 4px;margin-right:5px}.telemetry{position:fixed;right:18px;bottom:15px;color:#59706b;font:8px monospace;letter-spacing:1px}@media(max-width:640px){.vitals,.mission{width:43vw;padding:9px}.mission>div{display:none}.pause{position:fixed;top:74px;left:50%;transform:translateX(-50%)}.weapons{display:none}}
</style>
