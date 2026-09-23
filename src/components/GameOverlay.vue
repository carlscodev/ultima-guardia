<script setup lang="ts">
import type { GameState, ScreenState } from '@/types/game'
defineProps<{ screen: ScreenState; state: Readonly<GameState> }>()
const emit = defineEmits<{ start: []; resume: [] }>()
</script>

<template>
  <div v-if="screen === 'menu' || screen === 'paused' || screen === 'gameover'" class="overlay">
    <section class="panel">
      <div class="tag">{{ screen === 'paused' ? 'ENLACE TÁCTICO EN ESPERA' : 'TRANSMISIÓN // DISTRITO 09' }}</div>
      <p class="code">OPERACIÓN LG-09 <span>CLASIFICACIÓN NEGRA</span></p>
      <h1 v-if="screen === 'menu'">ÚLTIMA<br><em>GUARDIA.</em></h1>
      <h1 v-else-if="screen === 'paused'">TIEMPO<br><em>MUERTO.</em></h1>
      <h1 v-else>SEÑAL<br><em>PERDIDA.</em></h1>
      <p v-if="screen === 'menu'" class="copy">La ciudad cayó hace 19 horas. Tu radio sigue en silencio. Mantén la línea, recoge núcleos y sobrevive hasta el amanecer.</p>
      <p v-else-if="screen === 'paused'" class="copy">La simulación está detenida. El filtro de audio táctico permanece activo.</p>
      <p v-else class="copy">Resististe {{ Math.floor(state.elapsed) }} segundos, alcanzaste la oleada {{ state.wave }} y neutralizaste {{ state.kills }} hostiles.</p>
      <div v-if="screen === 'menu'" class="instructions"><span>WASD <b>MOVER</b></span><span>1 / 2 <b>ARMAS</b></span><span>ESPACIO <b>PULSO</b></span><span>P <b>PAUSA</b></span></div>
      <button v-if="screen === 'paused'" class="cta" @click="emit('resume')">CONTINUAR OPERACIÓN <span>→</span></button>
      <button v-else class="cta" @click="emit('start')">{{ screen === 'gameover' ? 'REINICIAR OPERACIÓN' : 'ENTRAR EN LA ZONA' }} <span>→</span></button>
      <small>RECOMENDADO: AURICULARES · CANVAS 2D · 60 FPS</small>
    </section>
    <div class="scan" />
  </div>
</template>

<style scoped>
.overlay{position:fixed;z-index:18;inset:0;display:flex;align-items:center;padding:clamp(24px,7vw,100px);background:linear-gradient(90deg,#040b0df5 0%,#06100fdb 46%,#06100f55 100%);backdrop-filter:blur(5px)}.panel{position:relative;z-index:2;width:min(570px,100%)}.tag{display:inline-block;border:1px solid #bfe98a50;padding:7px 10px;color:#c7ef99;font-size:9px;letter-spacing:2.4px}.code{font-size:9px;color:#71847e;letter-spacing:2px;margin-top:34px}.code span{margin-left:18px;color:#a26057}h1{font-size:clamp(58px,10vw,104px);line-height:.82;letter-spacing:-6px;margin:14px 0 27px;text-shadow:0 15px 50px #000}h1 em{font-style:normal;color:#c1eb8f}.copy{max-width:490px;color:#9eb0aa;line-height:1.7;font-size:13px;border-left:1px solid #9ec37a;padding-left:15px}.instructions{display:flex;gap:8px;margin:25px 0}.instructions span{border:1px solid #ffffff18;padding:8px 9px;color:#d7e4de;font:10px monospace}.instructions b{display:block;color:#657a74;font-size:7px;margin-top:4px}.cta{width:min(430px,100%);margin-top:14px;padding:17px 18px;text-align:left;background:#c6ef96;color:#0d1c17;border:0;font-weight:900;letter-spacing:1.5px;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%)}.cta span{float:right}.panel>small{display:block;color:#536762;font-size:7px;letter-spacing:1.5px;margin-top:12px}.scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,#c4f3d005 4px);mix-blend-mode:screen}@media(max-width:600px){.overlay{align-items:flex-end;padding-bottom:100px}h1{letter-spacing:-4px}.instructions{display:grid;grid-template-columns:1fr 1fr}.code{margin-top:20px}}
</style>
