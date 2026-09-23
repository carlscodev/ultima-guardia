<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { ArrowRight, ArrowUpRight, Crosshair, Headphones, Maximize, Minimize, Move, Play, Radio, Shield, Skull, Volume2, VolumeX, Zap } from '@lucide/vue'
import type { GameState, ScreenState } from '@/types/game'
import GameBriefing from '@/components/GameBriefing.vue'

defineProps<{ screen: ScreenState; state: Readonly<GameState>; muted: boolean; fullscreen: boolean; ready: boolean }>()
const emit = defineEmits<{ start: []; resume: []; menu: []; sound: []; fullscreen: [] }>()
const briefing = ref<'controls' | 'arsenal' | null>(null)
const sessionDialog = ref<HTMLDialogElement | null>(null)
const formatTime = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

watchEffect(() => {
  if (sessionDialog.value && !sessionDialog.value.open) sessionDialog.value.showModal()
})
</script>

<template>
  <section v-if="screen === 'menu'" class="command-menu" aria-label="Menú principal de Última Guardia">
    <div class="menu-art" aria-hidden="true">
      <img src="/images/quarantine-city.png" alt="" fetchpriority="high" />
    </div>
    <div class="menu-shade" aria-hidden="true" />
    <div class="scanlines" aria-hidden="true" />

    <header class="menu-header">
      <div class="wordmark"><Crosshair :size="29" :stroke-width="1.5" /><span>ÚLTIMA GUARDIA<small>NO HAY EXTRACCIÓN.</small></span></div>
      <nav class="menu-nav" aria-label="Información del juego">
        <span class="nav-active" aria-current="page">OPERACIÓN</span>
        <button @click="briefing = 'controls'">CÓMO JUGAR</button>
        <button @click="briefing = 'arsenal'">ARSENAL <ArrowUpRight :size="12" /></button>
      </nav>
      <div class="menu-tools">
        <span class="connection"><span class="status-dot" /> SEÑAL ESTABLE</span>
        <button class="icon-button" :aria-label="muted ? 'Activar sonido' : 'Silenciar sonido'" :aria-pressed="muted" :title="muted ? 'Activar sonido' : 'Silenciar sonido'" @click="emit('sound')"><VolumeX v-if="muted" /><Volume2 v-else /></button>
        <button class="icon-button" :aria-label="fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'" :title="fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'" @click="emit('fullscreen')"><Minimize v-if="fullscreen" /><Maximize v-else /></button>
      </div>
    </header>

    <div class="menu-content">
      <div class="hero">
        <div class="edition"><span class="edition-label"><span class="status-dot" /> PIXEL SURVIVAL</span><span>EDICIÓN NOCTURNA</span></div>
        <h1>ÚLTIMA<br /><em>GUARDIA<span>.</span></em></h1>
        <p class="hero-lead">La ciudad cayó. Tú todavía no.</p>
        <p class="hero-copy">Tu radio sigue en silencio. La horda se acerca.<br class="desktop-break" /> Sobrevive, evoluciona y aguanta hasta el amanecer.</p>
        <div class="hero-features"><span><Skull :size="14" /> Oleadas infinitas</span><i /><span><Crosshair :size="14" /> Disparo automático</span></div>
        <button class="enter-button" :disabled="!ready" @click="emit('start')"><Play :size="18" :stroke-width="1.8" /><span>{{ ready ? 'ENTRAR EN LA ZONA' : 'PREPARANDO ZONA…' }}</span><ArrowRight :size="20" /></button>
        <div class="start-note"><kbd>ENTER</kbd> PARA COMENZAR <span>·</span> UN JUGADOR</div>
      </div>

      <aside class="sector-label" aria-label="Ubicación de la operación"><span class="status-dot" /><div>DISTRITO 09<small>ZONA DE CUARENTENA</small></div><span class="sector-line" /></aside>

      <aside class="mission-card">
        <div class="mission-kicker"><Radio :size="14" /><span>ÚLTIMA TRANSMISIÓN</span><span class="transmission-bars" aria-hidden="true"><i /><i /><i /><i /></span></div>
        <p>«Si alguien escucha esto…<br />mantengan la posición.»</p>
        <div class="mission-divider" />
        <div class="threat"><span>NIVEL DE AMENAZA</span><strong><i /><i /><i /><i /><i /> CRÍTICO</strong></div>
        <span class="mission-corner" aria-hidden="true" />
      </aside>

      <div class="field-guide" aria-label="Controles principales">
        <div class="field-guide-label"><span>LO ESENCIAL</span><span class="guide-line" /></div>
        <div class="quick-controls">
          <div><Move /><span><strong>MUÉVETE</strong><small>WASD / Flechas</small></span></div>
          <div><Crosshair /><span><strong>SOBREVIVE</strong><small>Disparo automático</small></span></div>
          <div><Zap /><span><strong>DESPEJA</strong><small>Espacio / Pulso</small></span></div>
          <div><Shield /><span><strong>EVOLUCIONA</strong><small>Recoge experiencia</small></span></div>
        </div>
      </div>
    </div>

    <footer class="menu-footer"><span class="footer-status"><span class="status-dot" /> LA ÚLTIMA LÍNEA DE DEFENSA</span><span class="headphone-note"><Headphones :size="13" /> MEJOR CON AURICULARES</span><span>V.2.0 <span class="footer-slash">/</span> RESISTE LA NOCHE</span></footer>
    <GameBriefing v-if="briefing" :section="briefing" @close="briefing = null" />
  </section>

  <dialog v-if="screen === 'paused' || screen === 'gameover'" ref="sessionDialog" class="session-dialog" aria-labelledby="session-title" @cancel.prevent="screen === 'paused' ? emit('resume') : undefined">
    <section class="session-panel">
      <span class="session-icon"><Radio v-if="screen === 'paused'" :size="25" /><Skull v-else :size="25" /></span>
      <div class="session-kicker">{{ screen === 'paused' ? 'OPERACIÓN EN ESPERA' : 'FIN DE LA TRANSMISIÓN' }}</div>
      <h2 id="session-title" v-if="screen === 'paused'">TOMA <em>AIRE.</em></h2>
      <h2 id="session-title" v-else>SEÑAL <em>PERDIDA.</em></h2>
      <p>{{ screen === 'paused' ? 'La horda puede esperar. Vuelve cuando estés listo.' : 'La noche ganó esta vez. Tu próxima guardia empieza aquí.' }}</p>
      <div class="session-stats"><div><strong>{{ formatTime(state.elapsed) }}</strong><span>TIEMPO CON VIDA</span></div><div><strong>{{ state.wave.toString().padStart(2, '0') }}</strong><span>OLEADA</span></div><div><strong>{{ state.kills }}</strong><span>BAJAS</span></div></div>
      <button v-if="screen === 'paused'" class="enter-button" autofocus @click="emit('resume')"><Play :size="17" /><span>CONTINUAR OPERACIÓN</span><ArrowRight :size="18" /></button>
      <button v-else class="enter-button" autofocus @click="emit('start')"><Play :size="17" /><span>VOLVER A INTENTAR</span><ArrowRight :size="18" /></button>
      <button class="back-button" @click="emit('menu')">VOLVER AL MENÚ</button>
      <small v-if="screen === 'paused'" class="pause-hint">P / ESC PARA CONTINUAR</small>
    </section>
  </dialog>
</template>

<style scoped>
.command-menu { position: fixed; z-index: 10; inset: 0; display: flex; flex-direction: column; isolation: isolate; overflow: auto; background: #101613; }
.menu-art, .menu-shade, .scanlines { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.menu-art { overflow: hidden; }
.menu-art img { position: absolute; right: 0; top: 0; width: 78%; height: 100%; object-fit: cover; object-position: 56% 54%; opacity: .92; }
.menu-shade { background: linear-gradient(90deg, #0d1210 0%, #0d1210f7 25%, #0d1210d9 36%, #0d121042 57%, #0d121000 75%), linear-gradient(0deg, #0d1210f5, #0d121000 31%, #0d121000 80%, #0d121057); }
.scanlines { opacity: .2; background: repeating-linear-gradient(0deg, transparent 0 3px, #080e0950 3px 4px); }
.menu-header { min-height: 92px; display: flex; align-items: center; justify-content: space-between; gap: 24px; margin: 0 4%; border-bottom: 1px solid var(--border); }
.wordmark { display: flex; align-items: center; gap: 11px; color: var(--accent); }
.wordmark > span { font-family: var(--display); color: var(--foreground); font-size: 19px; letter-spacing: 1.7px; line-height: 1; }
.wordmark small { display: block; margin-top: 7px; font-family: 'DM Sans', sans-serif; color: var(--subtle); font-size: 7px; font-weight: 500; letter-spacing: 2px; }
.menu-nav { align-self: stretch; display: flex; align-items: stretch; gap: 30px; margin-left: 4%; }
.menu-nav > * { position: relative; display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; padding: 0 1px; font-size: 10px; font-weight: 600; letter-spacing: 1.25px; color: var(--muted); }
.menu-nav .nav-active { color: var(--accent); }
.nav-active::after { position: absolute; content: ''; bottom: -1px; height: 2px; left: 0; right: 0; background: var(--accent); }
.menu-nav button:hover { color: var(--foreground); }
.menu-tools { display: flex; align-items: center; gap: 8px; }
.connection { display: inline-flex; align-items: center; gap: 8px; margin-right: 17px; font-size: 8px; letter-spacing: 1.5px; color: #b6c0ad; }
.menu-content { position: relative; flex: 1; width: 88%; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; padding: 44px 0 136px; min-height: 635px; }
.hero { width: 530px; max-width: 100%; }
.edition { display: flex; align-items: center; gap: 15px; font-size: 8px; font-weight: 500; letter-spacing: 1.8px; color: var(--subtle); margin-bottom: 25px; }
.edition-label { display: inline-flex; align-items: center; gap: 7px; color: var(--accent); border: 1px solid #c2eb8938; background: #c2eb8906; padding: 7px 9px; }
h1 { margin: 0 0 24px -3px; font-size: clamp(98px, 9.3vw, 148px); line-height: .82; letter-spacing: -1.4px; font-weight: 800; }
h1 em { color: var(--accent); font-style: normal; }
h1 em span { color: var(--accent); }
.hero-lead { font-size: 17px; font-weight: 500; margin: 0 0 11px; letter-spacing: -.3px; }
.hero-copy { color: var(--muted); font-size: 12px; line-height: 1.9; margin: 0; }
.hero-features { display: flex; align-items: center; gap: 15px; margin: 21px 0 25px; color: #a7b19e; font-size: 10px; }
.hero-features span { display: flex; align-items: center; gap: 6px; }
.hero-features svg { color: #bbc7ac; stroke-width: 1.4; }
.hero-features i { width: 2px; height: 2px; background: #6c7767; }
.enter-button { display: flex; align-items: center; justify-content: flex-start; gap: 13px; padding: 0 21px; width: 354px; max-width: 100%; height: 60px; background: var(--accent); border: 1px solid #d6f3ad; color: #1c2a15; border-radius: 2px; font-size: 12px; font-weight: 800; letter-spacing: 1.2px; box-shadow: 0 4px 30px #bbf08a08; }
.enter-button > svg:last-child { margin-left: auto; }
.enter-button:hover:not(:disabled) { background: #d3f2aa; box-shadow: 0 4px 36px #bbf08a16; }
.enter-button:disabled { opacity: .6; }
.start-note { display: flex; align-items: center; gap: 7px; margin-top: 13px; padding-left: 2px; color: #85907e; font-size: 7px; letter-spacing: 1.3px; }
.start-note kbd { border: 1px solid #b6c3a730; padding: 3px 4px; font-size: 7px; color: #a9b29f; border-radius: 2px; }
.start-note > span { margin: 0 3px; }
.sector-label { position: absolute; top: 52px; right: 0; display: flex; align-items: flex-start; gap: 10px; font-size: 10px; font-weight: 600; letter-spacing: 2px; color: #ced8c4; }
.sector-label .status-dot { margin-top: 4px; }
.sector-label small { display: block; margin-top: 7px; color: #a6b49b; font-size: 7px; font-weight: 400; letter-spacing: 1.6px; }
.sector-line { width: 29px; border-top: 1px solid #becda760; margin-top: 5px; }
.mission-card { position: absolute; right: 0; bottom: 49px; width: 278px; padding: 21px; background: #0b120ed6; border: 1px solid #c2d2b52b; backdrop-filter: blur(8px); }
.mission-kicker { display: flex; align-items: center; gap: 8px; color: #a9b49d; font-size: 8px; letter-spacing: 1.25px; }
.mission-kicker > svg { color: var(--accent); }
.transmission-bars { display: flex; gap: 2px; align-items: flex-end; height: 11px; margin-left: auto; }
.transmission-bars i { width: 2px; background: #98b581; height: 4px; }
.transmission-bars i:nth-child(2) { height: 7px; }.transmission-bars i:nth-child(3) { height: 10px; }.transmission-bars i:nth-child(4) { height: 6px; }
.mission-card p { font-size: 12px; color: #d8ded0; line-height: 1.8; margin: 15px 0 17px; }
.mission-divider { height: 1px; background: var(--border); }
.threat { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 13px; font-size: 6px; letter-spacing: 1px; color: var(--muted); }
.threat strong { display: flex; align-items: center; gap: 3px; font-size: 7px; font-weight: 500; color: var(--danger); }
.threat strong i { display: block; width: 3px; height: 7px; background: var(--danger); opacity: .8; }
.threat strong i:last-of-type { margin-right: 4px; opacity: .4; }
.mission-corner { position: absolute; top: -1px; right: -1px; width: 7px; height: 7px; border-top: 1px solid #bfd4a8; border-right: 1px solid #bfd4a8; }
.field-guide { position: absolute; left: 0; bottom: 46px; width: 610px; max-width: calc(100% - 340px); }
.field-guide-label { display: flex; align-items: center; gap: 15px; margin-bottom: 21px; font-size: 7px; letter-spacing: 2px; color: var(--subtle); }
.guide-line { height: 1px; background: var(--border); flex: 1; }
.quick-controls { display: flex; gap: 24px; justify-content: space-between; }
.quick-controls > div { display: flex; align-items: center; gap: 11px; }
.quick-controls svg { width: 19px; height: 19px; color: #a2b094; stroke-width: 1.25; }
.quick-controls strong { display: block; font-size: 8px; letter-spacing: 1px; color: #cdd4c4; font-weight: 500; }
.quick-controls small { display: block; font-size: 9px; margin-top: 5px; color: var(--subtle); white-space: nowrap; }
.menu-footer { position: relative; min-height: 53px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 4%; padding-bottom: env(safe-area-inset-bottom); border-top: 1px solid var(--border); font-size: 7px; letter-spacing: 1.5px; color: #939d89; }
.footer-status, .headphone-note { display: flex; align-items: center; gap: 8px; }
.footer-status .status-dot { width: 4px; height: 4px; }
.footer-slash { margin: 0 8px; color: #616e5b; }
.session-dialog { width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 24px; border: 0; background: #0b120de8; color: var(--foreground); backdrop-filter: blur(9px); }
.session-dialog[open] { display: grid; place-items: center; }
.session-dialog::backdrop { background: #080d0966; }
.session-panel { width: min(440px, 100%); text-align: center; }
.session-icon { display: inline-flex; padding: 14px; border: 1px solid #c2eb8930; color: var(--accent); margin-bottom: 23px; }
.session-kicker { font-size: 9px; color: var(--accent); letter-spacing: 2.5px; }
.session-panel h2 { font-size: clamp(52px, 9vw, 75px); line-height: 1; margin: 16px 0; letter-spacing: -.5px; }
.session-panel h2 em { color: var(--accent); font-style: normal; }
.session-panel > p { color: var(--muted); font-size: 12px; line-height: 1.8; }
.session-stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 21px 0; margin: 24px 0; border-block: 1px solid var(--border); }
.session-stats strong { display: block; color: var(--foreground); font-family: var(--display); font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
.session-stats span { display: block; color: var(--subtle); font-size: 7px; letter-spacing: 1.5px; margin-top: 4px; }
.session-panel .enter-button { width: 100%; }
.back-button { width: 100%; padding: 17px; color: var(--muted); background: transparent; border: 1px solid var(--border); margin-top: 10px; font-size: 9px; letter-spacing: 1.5px; }
.back-button:hover { border-color: var(--accent); color: var(--accent); }
.pause-hint { display: block; margin-top: 20px; color: var(--subtle); font-size: 8px; letter-spacing: 1.5px; }
@media (min-width: 1600px) { .menu-content { width: 86%; } .hero { width: 600px; } .menu-art img { width: 75%; } .hero-copy { font-size: 14px; } .hero-lead { font-size: 19px; } .enter-button { width: 395px; height: 65px; } }
@media (max-width: 1100px) { .connection { display: none; } .menu-nav { gap: 22px; margin-left: 0; } .field-guide { max-width: calc(100% - 310px); } .quick-controls { gap: 15px; flex-wrap: wrap; } .quick-controls > div { width: 44%; } .menu-content { padding-bottom: 155px; min-height: 700px; } .mission-card { bottom: 45px; } .field-guide { bottom: 40px; } .menu-art img { width: 95%; object-position: 38% 50%; } .menu-shade { background: linear-gradient(90deg, #0d1210f5, #0d1210c9 35%, #0d121032 70%), linear-gradient(0deg, #0d1210f5, transparent 35%); } }
@media (max-width: 700px) { .menu-header { min-height: 77px; gap: 10px; margin: 0 6%; flex-wrap: wrap; padding: 19px 0 0; } .wordmark > span { font-size: 17px; } .wordmark > svg { width: 25px; } .menu-tools { margin-left: auto; gap: 5px; } .icon-button { width: 33px; height: 33px; } .menu-nav { order: 3; height: 44px; width: 100%; justify-content: flex-start; gap: 27px; } .menu-nav > * { font-size: 8px; } .menu-content { width: 88%; padding: 39px 0 147px; min-height: 628px; justify-content: flex-start; } .hero { width: 100%; } .edition { font-size: 6px; gap: 10px; margin-bottom: 22px; } h1 { font-size: clamp(92px, 23vw, 130px); margin-bottom: 23px; } .hero-lead { font-size: 16px; } .hero-copy { max-width: 305px; font-size: 11px; } .hero-features { font-size: 9px; gap: 10px; margin: 19px 0 23px; } .enter-button { width: 330px; height: 55px; font-size: 11px; } .menu-art img { width: 100%; height: 80%; object-position: 67% 50%; opacity: .56; } .menu-shade { background: linear-gradient(90deg, #0d1210e3, #0d1210a3 45%, #0d121040), linear-gradient(0deg, #0d1210 2%, #0d1210 20%, #0d121000 70%); } .sector-label, .mission-card { display: none; } .field-guide { width: 100%; max-width: none; bottom: 33px; } .field-guide-label { margin-bottom: 17px; } .quick-controls { gap: 17px 20px; } .quick-controls > div { width: 44%; } .quick-controls small { font-size: 8px; } .quick-controls strong { font-size: 7px; } .menu-footer { min-height: 49px; margin: 0 6%; font-size: 6px; letter-spacing: 1px; } .headphone-note { display: none; } .footer-status { max-width: 140px; font-size: 6px; line-height: 1.7; } .session-icon { margin-bottom: 18px; } }
@media (max-height: 720px) and (min-width: 701px) { .menu-header { min-height: 73px; } .menu-content { min-height: 540px; padding: 33px 0 122px; } h1 { font-size: 108px; } .edition { margin-bottom: 19px; } .hero-features { margin: 14px 0 20px; } .field-guide { bottom: 27px; } .mission-card { bottom: 26px; } .hero-lead { font-size: 15px; } .hero-copy { font-size: 11px; } .menu-footer { min-height: 44px; } }
@media (max-height: 540px) and (min-width: 701px) { .menu-content { min-height: 475px; } .menu-art img { height: 100%; } }
</style>
