<script setup lang="ts">
import type { IUpgrade } from '@/types/game'
defineProps<{ upgrades: readonly IUpgrade[] }>()
const emit = defineEmits<{ choose: [upgrade: IUpgrade] }>()
</script>

<template>
  <div class="overlay">
    <section class="panel">
      <div class="tag">NEUROADAPTACIÓN DISPONIBLE</div>
      <p class="kicker">PROTOCOLO DE SUPERVIVENCIA</p>
      <h2>ELIGE UNA<br><em>VENTAJA.</em></h2>
      <div class="cards">
        <button v-for="upgrade in upgrades" :key="upgrade.id" @click="emit('choose', upgrade)">
          <span>{{ upgrade.icon }}</span><small>MEJORA // {{ upgrade.id.toUpperCase() }}</small>
          <strong>{{ upgrade.name }}</strong><p>{{ upgrade.description }}</p><i>INSTALAR →</i>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay{position:fixed;z-index:20;inset:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 45%,#163027d9,#030a0bed);backdrop-filter:blur(9px)}.panel{width:min(930px,100%)}.tag,.kicker{text-align:center;font-size:9px;letter-spacing:3px;color:#9fb6ae}.tag{width:max-content;margin:auto;border:1px solid #b8ed8b55;padding:7px 11px;color:#caf49e}.kicker{margin-top:24px}h2{text-align:center;margin:5px 0 26px;font-size:clamp(37px,7vw,68px);line-height:.88;letter-spacing:-3px}h2 em{font-style:normal;color:#c6f290}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cards button{position:relative;min-height:230px;padding:20px;text-align:left;color:#e9f2e8;background:linear-gradient(145deg,#14231fee,#0a1514ee);border:1px solid #bbf18b38;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%)}.cards button:hover{transform:translateY(-5px);border-color:#c5f598;background:#1b3027;box-shadow:0 14px 45px #0008}.cards button>span{font-size:38px;color:#c8f698}.cards small{display:block;margin:15px 0 6px;color:#70867f;font-size:8px;letter-spacing:1.4px}.cards strong{font-size:15px;letter-spacing:.7px}.cards p{color:#9bada7;font-size:12px;line-height:1.5}.cards i{position:absolute;bottom:17px;font-style:normal;font-size:9px;letter-spacing:1.5px;color:#bce890}@media(max-width:650px){.cards{grid-template-columns:1fr}.cards button{min-height:120px}.cards button>span{float:left;margin-right:15px}.cards small{margin-top:4px}.cards i{display:none}h2{margin-bottom:16px}}
</style>
