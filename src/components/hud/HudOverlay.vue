<script setup lang="ts">
import { Crosshair, Pause, ScanLine, Skull, Timer, Volume2, VolumeX } from '@lucide/vue'
import type { GameState, WeaponKind } from '@/types/game'

defineProps<{ state: Readonly<GameState>; muted: boolean }>()
const emit = defineEmits<{ weapon: [weapon: WeaponKind]; pause: []; sound: [] }>()
const time = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
</script>

<template>
  <header class="hud">
    <section class="vitals tactical-panel" aria-label="Estado del superviviente">
      <div class="operator-line"><span class="operator-number">01</span><div><span>SUPERVIVIENTE</span><small><span class="status-dot" /> EN OPERACIÓN</small></div><b>NVL. {{ state.level.toString().padStart(2, '0') }}</b></div>
      <div class="health-label"><span>INTEGRIDAD</span><strong :class="{ critical: state.hp < state.maxHp * .3 }">{{ Math.max(0, Math.ceil(state.hp)) }} <small>/ {{ state.maxHp }}</small></strong></div>
      <div class="bar health" role="progressbar" aria-label="Vida" :aria-valuenow="Math.max(0, Math.ceil(state.hp))" :aria-valuemax="state.maxHp" :aria-valuemin="0"><i :class="{ critical: state.hp < state.maxHp * .3 }" :style="{ transform: `scaleX(${Math.max(0, state.hp / state.maxHp)})` }" /></div>
      <div class="xp-line"><span>EXPERIENCIA</span><span>{{ state.xp }} / {{ state.xpNeeded }}</span></div>
      <div class="bar xp" role="progressbar" aria-label="Experiencia" :aria-valuenow="state.xp" :aria-valuemax="state.xpNeeded" :aria-valuemin="0"><i :style="{ transform: `scaleX(${Math.min(1, state.xp / state.xpNeeded)})` }" /></div>
    </section>

    <div class="hud-tools"><button class="icon-button" :aria-label="muted ? 'Activar sonido' : 'Silenciar sonido'" :aria-pressed="muted" @click="emit('sound')"><VolumeX v-if="muted" /><Volume2 v-else /></button><button class="icon-button" aria-label="Pausar" title="Pausar (P / Esc)" @click="emit('pause')"><Pause /></button></div>

    <section class="mission tactical-panel" aria-label="Estado de la oleada">
      <div class="mission-zone"><span class="status-dot" /> DISTRITO 09 <span>/</span> CUARENTENA</div>
      <div class="wave-title">OLEADA <strong>{{ state.wave.toString().padStart(2, '0') }}</strong></div>
      <div class="mission-stats"><span><Skull :size="13" /> {{ state.kills }} BAJAS</span><i /><span><Timer :size="13" /> {{ time(state.elapsed) }}</span></div>
      <div class="enemy-count"><span class="enemy-dot" /> {{ state.enemies }} HOSTILES EN LA ZONA</div>
    </section>
  </header>

  <nav class="weapons tactical-panel" aria-label="Cambiar arma">
    <button :class="{ active: state.weapon === 'rifle' }" :aria-pressed="state.weapon === 'rifle'" aria-label="Rifle M4" @click="emit('weapon', 'rifle')"><kbd>1</kbd><Crosshair :size="22" /><span><small>PRECISIÓN</small><strong>RIFLE M4</strong></span><span v-if="state.weapon === 'rifle'" class="weapon-dot" /></button>
    <span class="weapon-separator" />
    <button :class="{ active: state.weapon === 'shotgun' }" :aria-pressed="state.weapon === 'shotgun'" aria-label="Escopeta K-12" @click="emit('weapon', 'shotgun')"><kbd>2</kbd><ScanLine :size="22" /><span><small>DISPERSIÓN</small><strong>ESCOPETA K-12</strong></span><span v-if="state.weapon === 'shotgun'" class="weapon-dot" /></button>
  </nav>
  <div class="telemetry"><span class="status-dot" /> {{ state.fps }} FPS <i /> DISPARO AUTOMÁTICO ACTIVO</div>
</template>

<style scoped>
.hud { position: fixed; z-index: 4; top: max(24px, env(safe-area-inset-top)); left: max(28px, env(safe-area-inset-left)); right: max(28px, env(safe-area-inset-right)); display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; pointer-events: none; user-select: none; }
.tactical-panel { background: #0c1511de; border: 1px solid #c2d5b830; box-shadow: 0 7px 24px #0003; backdrop-filter: blur(8px); border-radius: 2px; }
.vitals { padding: 17px 19px; width: 264px; }
.operator-line { display: flex; align-items: center; gap: 10px; }
.operator-number { display: grid; place-items: center; width: 33px; height: 36px; border: 1px solid #a7c29138; color: var(--accent); font-family: var(--display); font-size: 21px; font-weight: 700; }
.operator-line > div > span { font-size: 8px; font-weight: 600; letter-spacing: 1.5px; }
.operator-line small { display: flex; align-items: center; gap: 5px; font-size: 6px; color: var(--subtle); letter-spacing: 1px; margin-top: 5px; }
.operator-line small .status-dot { width: 3px; height: 3px; }
.operator-line b { margin-left: auto; padding: 4px 5px; font-size: 8px; font-weight: 500; color: var(--accent); border: 1px solid #c2eb8930; }
.health-label { display: flex; align-items: baseline; justify-content: space-between; margin-top: 17px; }
.health-label > span { font-size: 7px; letter-spacing: 1.4px; color: #aab6a2; }
.health-label strong { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.health-label small { font-size: 9px; font-weight: 400; color: var(--subtle); }
.bar { overflow: hidden; background: #293327; margin-top: 7px; }
.bar i { display: block; width: 100%; height: 100%; transform-origin: left; transition: transform .15s linear; }
.health { height: 6px; }
.health i { background: var(--accent); }
.health i.critical { background: var(--danger); }.health-label .critical { color: var(--danger); }
.xp-line { display: flex; justify-content: space-between; font-size: 6px; color: var(--subtle); letter-spacing: 1.2px; margin-top: 12px; }
.xp { height: 2px; margin-top: 6px; background: #20312d; }.xp i { background: #93bfb2; }
.hud-tools { display: flex; gap: 7px; pointer-events: auto; }
.hud-tools .icon-button { background: #0c1511d9; }
.mission { width: 250px; padding: 16px 19px; text-align: right; }
.mission-zone { display: flex; gap: 7px; align-items: center; justify-content: flex-end; font-size: 7px; letter-spacing: 1px; color: var(--muted); }.mission-zone > span:not(.status-dot) { color: #617354; }
.mission-zone .status-dot { width: 4px; height: 4px; }
.wave-title { font-family: var(--display); font-weight: 700; font-size: 31px; letter-spacing: 1.5px; margin: 4px 0 7px; }
.wave-title strong { color: var(--accent); font-size: 37px; padding-left: 6px; }
.mission-stats { display: flex; justify-content: flex-end; align-items: center; gap: 13px; font-size: 9px; color: #d2dbc9; font-variant-numeric: tabular-nums; letter-spacing: .6px; }
.mission-stats > span { display: inline-flex; align-items: center; gap: 6px; }.mission-stats svg { color: #9aa88d; stroke-width: 1.5; }.mission-stats > i { height: 10px; width: 1px; background: var(--border); }
.enemy-count { margin-top: 15px; padding-top: 11px; border-top: 1px solid var(--border); font-size: 6px; letter-spacing: 1.4px; color: var(--subtle); }.enemy-dot { display: inline-block; width: 3px; height: 3px; margin-right: 5px; background: var(--danger); }
.weapons { position: fixed; z-index: 5; left: 50%; bottom: max(32px, env(safe-area-inset-bottom)); transform: translateX(-50%); display: flex; gap: 5px; padding: 6px; }
.weapons button { position: relative; display: flex; align-items: center; gap: 14px; border: 1px solid transparent; background: transparent; color: var(--subtle); padding: 13px 17px 13px 12px; text-align: left; min-width: 161px; }
.weapons button.active { color: var(--accent); background: #bbeb8310; border-color: #bbeb8330; }.weapons button:hover { color: var(--accent); }
.weapons kbd { border: 1px solid #b0c6a838; border-radius: 2px; padding: 2px 4px; font-size: 7px; color: var(--muted); }
.weapons small { display: block; font-size: 6px; letter-spacing: 1.1px; font-weight: 400; opacity: .75; }
.weapons strong { display: block; font-size: 9px; letter-spacing: .7px; font-weight: 500; margin-top: 5px; }
.weapons svg { stroke-width: 1.3; }.weapon-dot { position: absolute; width: 3px; height: 3px; background: var(--accent); top: 8px; right: 8px; }.weapon-separator { width: 1px; margin: 9px 0; background: var(--border); }
.telemetry { position: fixed; z-index: 3; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; color: #8c9c81; font-size: 6px; letter-spacing: 1px; white-space: nowrap; text-shadow: 0 1px 4px #000; pointer-events: none; }
.telemetry .status-dot { width: 3px; height: 3px; }.telemetry > i { width: 2px; height: 2px; background: #7c8b73; margin: 0 4px; }
@media (max-width: 700px) { .hud { top: max(15px, env(safe-area-inset-top)); left: 14px; right: 14px; gap: 10px; } .vitals { width: 47%; padding: 11px; } .operator-line { gap: 6px; }.operator-number { width: 24px; height: 29px; font-size: 17px; }.operator-line > div > span { font-size: 6px; letter-spacing: .5px; }.operator-line small { font-size: 5px; letter-spacing: .4px; }.operator-line b { font-size: 6px; padding: 3px; }.health-label { margin-top: 12px; }.health-label > span { font-size: 6px; }.health-label strong { font-size: 10px; }.mission { width: 47%; padding: 11px; }.mission-zone { font-size: 5px; gap: 4px; letter-spacing: .8px; }.wave-title { font-size: 24px; letter-spacing: 1px; margin: 1px 0 4px; }.wave-title strong { font-size: 30px; }.mission-stats { font-size: 7px; gap: 7px; }.mission-stats svg { width: 11px; }.enemy-count { font-size: 5px; letter-spacing: 1px; margin-top: 10px; padding-top: 9px; }.hud-tools { position: absolute; top: 139px; right: 0; }.hud-tools .icon-button { width: 33px; height: 33px; }.weapons { bottom: max(28px, env(safe-area-inset-bottom)); padding: 3px; gap: 3px; }.weapons button { min-width: 110px; padding: 10px; gap: 8px; }.weapons button > svg { width: 16px; }.weapons strong { font-size: 7px; }.weapons small { font-size: 5px; }.weapons kbd { display: none; }.telemetry { bottom: 10px; font-size: 5px; } }
@media (max-height: 520px) { .hud { top: 12px; }.vitals { padding: 10px 12px; width: 220px; }.operator-line small, .xp-line, .enemy-count { display: none; }.health-label { margin-top: 8px; }.mission { width: 205px; padding: 10px 13px; }.wave-title { font-size: 24px; margin: 0; }.wave-title strong { font-size: 29px; }.weapons { bottom: 22px; }.weapons button { padding-block: 9px; }.telemetry { bottom: 7px; }.hud-tools { top: 105px; } }
</style>
