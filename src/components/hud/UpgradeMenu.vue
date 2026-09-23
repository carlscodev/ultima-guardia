<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, ChevronsUp, Crosshair, Footprints, ShieldPlus, Target, Zap } from '@lucide/vue'
import type { IUpgrade } from '@/types/game'

const props = defineProps<{ upgrades: readonly IUpgrade[]; level: number }>()
const emit = defineEmits<{ choose: [upgrade: IUpgrade] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const icons = { fireRate: ChevronsUp, damage: Target, speed: Footprints, pulse: Zap, armor: ShieldPlus, range: Crosshair }
const chooseKey = (event: KeyboardEvent): void => {
  if (event.isComposing || event.keyCode === 229 || event.repeat) return
  const upgrade = props.upgrades[Number(event.key) - 1]
  if (upgrade) { event.preventDefault(); emit('choose', upgrade) }
}
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="upgrade-dialog" aria-labelledby="upgrade-title" @cancel.prevent @keydown="chooseKey">
    <section class="panel">
      <div class="level-tag"><ChevronsUp :size="17" /> NIVEL {{ level.toString().padStart(2, '0') }} ALCANZADO</div>
      <h2 id="upgrade-title">ELIGE TU <em>VENTAJA.</em></h2>
      <p class="upgrade-copy">Un poco más fuerte. Un poco más vivo. Elige cómo seguir.</p>
      <div class="cards">
        <button v-for="(upgrade, index) in upgrades" :data-testid="`upgrade-${upgrade.id}`" :key="upgrade.id" :autofocus="index === 0" @click="emit('choose', upgrade)">
          <div class="card-top"><span class="upgrade-icon"><component :is="icons[upgrade.id]" :size="28" :stroke-width="1.4" /></span><kbd>{{ index + 1 }}</kbd></div>
          <small>MEJORA TÁCTICA</small><strong>{{ upgrade.name }}</strong><p>{{ upgrade.description }}</p>
          <span class="install">ELEGIR MEJORA <ArrowRight :size="15" /></span>
        </button>
      </div>
      <p class="upgrade-note">LA PARTIDA ESTÁ EN PAUSA MIENTRAS ELIGES</p>
    </section>
  </dialog>
</template>

<style scoped>
.upgrade-dialog { width: 100%; height: 100%; max-width: none; max-height: none; padding: 30px; margin: 0; border: none; background: #0b130eeb; backdrop-filter: blur(7px); color: var(--foreground); }
.upgrade-dialog[open] { display: grid; place-items: center; }.upgrade-dialog::backdrop { background: #070b08aa; }
.panel { width: min(830px, 100%); }
.level-tag { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 9px; letter-spacing: 2px; color: var(--accent); }
h2 { font-size: clamp(42px, 6vw, 70px); text-align: center; line-height: 1; margin: 19px 0 12px; }h2 em { font-style: normal; color: var(--accent); }
.upgrade-copy { text-align: center; color: var(--muted); font-size: 12px; line-height: 1.7; margin-bottom: 32px; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.cards button { display: flex; flex-direction: column; min-height: 259px; text-align: left; padding: 24px; color: var(--foreground); border: 1px solid #c2d5b830; background: #152016; border-radius: 2px; }
.cards button:hover { border-color: var(--accent); background: #1c2b1b; transform: translateY(-4px); }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; width: 100%; margin-bottom: 24px; }
.upgrade-icon { display: grid; place-items: center; width: 45px; height: 45px; border: 1px solid #c2eb8933; color: var(--accent); background: var(--accent-soft); }
kbd { font-size: 8px; border: 1px solid #c2d5b830; color: var(--subtle); padding: 4px 7px; }
.cards small { font-size: 7px; letter-spacing: 1.5px; color: var(--subtle); margin-bottom: 6px; }
.cards strong { font-family: var(--display); font-size: 24px; font-weight: 700; }
.cards p { font-size: 11px; line-height: 1.7; color: var(--muted); margin: 10px 0 25px; }
.install { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding-top: 15px; margin-top: auto; border-top: 1px solid var(--border); font-size: 8px; letter-spacing: 1px; color: var(--accent); }
.upgrade-note { color: var(--subtle); font-size: 7px; letter-spacing: 1.5px; text-align: center; margin-top: 25px; }
@media (max-width: 650px) { .upgrade-dialog { padding: 22px; }.cards { grid-template-columns: 1fr; gap: 10px; }.cards button { min-height: 115px; padding: 16px 17px 16px 84px; position: relative; }.card-top { position: absolute; width: 100%; left: 17px; top: 18px; margin: 0; }.card-top kbd { margin-right: 34px; }.cards strong { font-size: 23px; }.cards p { margin-bottom: 0; font-size: 10px; }.cards small { font-size: 6px; padding-right: 25px; }.install { display: none; }h2 { font-size: 42px; margin-top: 14px; }.upgrade-copy { font-size: 11px; margin-bottom: 24px; }.upgrade-note { font-size: 6px; }.level-tag { font-size: 8px; } }
@media (max-height: 500px) and (min-width: 651px) { .upgrade-dialog { padding: 22px; }h2 { font-size: 45px; margin: 12px 0 8px; }.upgrade-copy { margin-bottom: 20px; }.cards button { min-height: 210px; padding: 19px; }.card-top { margin-bottom: 15px; }.upgrade-note { margin-top: 17px; } }
</style>
