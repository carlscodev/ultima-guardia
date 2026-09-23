<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, Crosshair, Heart, Move, Pause, ScanLine, Shield, X, Zap } from '@lucide/vue'

defineProps<{ section: 'controls' | 'arsenal' }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="briefing" aria-labelledby="briefing-title" @cancel.prevent="emit('close')" @click="($event.target === dialog) && emit('close')">
    <div class="briefing-inner">
      <header><span>MANUAL DEL SUPERVIVIENTE / 09</span><button class="icon-button" aria-label="Cerrar información" autofocus @click="emit('close')"><X :size="17" /></button></header>
      <span class="briefing-kicker">{{ section === 'controls' ? 'ANTES DE ENTRAR' : 'TU ÚLTIMA LÍNEA DE DEFENSA' }}</span>
      <h2 id="briefing-title">{{ section === 'controls' ? 'CADA SEGUNDO CUENTA.' : 'CONOCE TU ARSENAL.' }}</h2>
      <p class="intro">{{ section === 'controls' ? 'Mantente en movimiento. El arma se encarga del resto.' : 'Ambas armas están disponibles desde el inicio. Cámbialas en cualquier momento.' }}</p>
      <div v-if="section === 'controls'" class="control-list">
        <div><Move /><span><strong>Muévete para sobrevivir</strong><small>Usa WASD, las flechas o el joystick táctil en móvil.</small></span><kbd>W A S D</kbd></div>
        <div><Crosshair /><span><strong>Disparo automático</strong><small>Atacas al enemigo más cercano dentro de tu alcance.</small></span><kbd>AUTO</kbd></div>
        <div><Zap /><span><strong>Pulso defensivo</strong><small>Daña y empuja a los enemigos. Se recarga en 9 segundos.</small></span><kbd>ESPACIO</kbd></div>
        <div><Shield /><span><strong>Recoge y evoluciona</strong><small>Los cristales de experiencia desbloquean mejoras a elegir.</small></span><kbd>EXP</kbd></div>
        <div><Heart /><span><strong>Recupera tu vida</strong><small>Recoge botiquines. Cada nueva oleada recupera algo de vida.</small></span><kbd>+ VIDA</kbd></div>
        <div><Pause /><span><strong>Tómate un respiro</strong><small>Pausa la partida sin perder tu progreso actual.</small></span><kbd>P / ESC</kbd></div>
      </div>
      <div v-else class="arsenal-grid">
        <article><div class="weapon-heading"><Crosshair :size="31" /><kbd>1</kbd></div><span>PRECISIÓN · ALCANCE</span><h3>RIFLE M4</h3><p>Disparo rápido y preciso. Ideal para mantener a la horda a distancia.</p><dl><div><dt>CADENCIA</dt><dd><i /><i /><i /><i /><i class="off" /></dd></div><div><dt>DISPERSIÓN</dt><dd><i /><i class="off" /><i class="off" /><i class="off" /><i class="off" /></dd></div></dl></article>
        <article><div class="weapon-heading"><ScanLine :size="31" /><kbd>2</kbd></div><span>DISPERSIÓN · POTENCIA</span><h3>ESCOPETA K-12</h3><p>Siete perdigones por disparo. Para cuando los enemigos están demasiado cerca.</p><dl><div><dt>CADENCIA</dt><dd><i /><i /><i class="off" /><i class="off" /><i class="off" /></dd></div><div><dt>DISPERSIÓN</dt><dd><i /><i /><i /><i /><i /></dd></div></dl></article>
      </div>
      <div v-if="section === 'arsenal'" class="pulse-tip"><Zap :size="21" /><p><strong>EL PLAN B: PULSO EMP</strong><span>Pulsa espacio o el botón de pulso para despejar tu alrededor.</span></p></div>
      <button class="understood" @click="emit('close')">ENTENDIDO. ESTOY LISTO. <ArrowRight :size="17" /></button>
    </div>
  </dialog>
</template>

<style scoped>
.briefing { color: var(--foreground); background: #121a15; border: 1px solid #c4d4b72e; width: min(630px, calc(100% - 32px)); max-height: calc(100dvh - 40px); padding: 0; box-shadow: 0 25px 100px #0009; }
.briefing::backdrop { background: #070d0bdb; backdrop-filter: blur(8px); }
.briefing-inner { padding: 27px 33px 31px; }
header { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding-bottom: 19px; border-bottom: 1px solid var(--border); margin-bottom: 28px; }
header > span { font-size: 8px; color: var(--subtle); letter-spacing: 1.7px; }
header .icon-button { width: 31px; height: 31px; }
.briefing-kicker { font-size: 8px; letter-spacing: 2px; color: var(--accent); }
h2 { font-size: 39px; line-height: 1.1; margin: 11px 0 10px; }
.intro { color: var(--muted); font-size: 12px; line-height: 1.7; margin: 0 0 23px; }
.control-list > div { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border); }
.control-list svg { width: 20px; height: 20px; color: var(--accent); flex-shrink: 0; stroke-width: 1.5; }
.control-list strong { display: block; font-size: 12px; font-weight: 500; }
.control-list small { display: block; font-size: 10px; line-height: 1.6; color: var(--muted); margin-top: 4px; }
kbd { flex-shrink: 0; border: 1px solid #c4d4b733; background: #c4d4b708; color: #c4d0bb; font-size: 7px; letter-spacing: 1px; padding: 5px 6px; border-radius: 2px; }
.control-list kbd { margin-left: auto; }
.understood { display: flex; width: 100%; align-items: center; justify-content: space-between; margin-top: 26px; padding: 17px 19px; color: #1c2a15; background: var(--accent); border: 0; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
.understood:hover { background: #d3f2aa; }
.arsenal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.arsenal-grid article { padding: 20px; border: 1px solid var(--border); background: #0c130f; }
.weapon-heading { display: flex; align-items: center; justify-content: space-between; color: var(--accent); margin-bottom: 27px; }
.weapon-heading kbd { font-size: 12px; padding: 5px 9px; }
.arsenal-grid article > span { color: var(--subtle); font-size: 7px; letter-spacing: 1.3px; }
h3 { margin: 7px 0 10px; font-size: 29px; }
.arsenal-grid p { font-size: 11px; line-height: 1.8; color: var(--muted); }
dl { padding-top: 13px; border-top: 1px solid var(--border); margin: 20px 0 0; }
dl > div { display: flex; justify-content: space-between; margin-top: 8px; }
dt { font-size: 7px; letter-spacing: 1px; color: var(--muted); }
dd { display: flex; gap: 3px; margin: 0; }
dd i { width: 9px; height: 5px; background: var(--accent); }dd i.off { background: #2b3927; }
.pulse-tip { display: flex; align-items: center; gap: 14px; color: var(--accent); padding: 17px 0 0; }
.pulse-tip p { margin: 0; }.pulse-tip strong { display: block; font-size: 8px; letter-spacing: 1.3px; }.pulse-tip span { display: block; color: var(--muted); font-size: 10px; line-height: 1.6; margin-top: 6px; }
@media (max-width: 600px) { .briefing-inner { padding: 20px; } h2 { font-size: 32px; } .control-list > div { gap: 12px; padding: 13px 0; } .control-list small { font-size: 9px; } .control-list strong { font-size: 11px; } .control-list kbd { font-size: 6px; padding: 5px; } .arsenal-grid { gap: 9px; } .arsenal-grid article { padding: 15px; } h3 { font-size: 24px; } .arsenal-grid p { font-size: 10px; } dt { font-size: 6px; } dd i { width: 6px; } }
</style>
