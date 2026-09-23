<script setup lang="ts">
import { ref,onBeforeUnmount } from 'vue'
import { Crosshair,Move } from '@lucide/vue'
const props=defineProps<{aim?:boolean;size:number}>();const emit=defineEmits<{move:[x:number,y:number];release:[]}>();const el=ref<HTMLElement|null>(null);const x=ref(0),y=ref(0);let id:number|null=null
function move(e:PointerEvent){if(id!==e.pointerId||!el.value)return;const r=el.value.getBoundingClientRect(),max=r.width*.31;let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const d=Math.hypot(dx,dy);if(d>max){dx*=max/d;dy*=max/d}x.value=dx;y.value=dy;emit('move',dx/max,dy/max)}
function down(e:PointerEvent){if(id!==null)return;e.preventDefault();id=e.pointerId;el.value?.setPointerCapture(id);move(e)}function release(e:PointerEvent){if(id!==e.pointerId)return;id=null;x.value=y.value=0;emit('release')}onBeforeUnmount(()=>emit('release'))
</script>
<template><div ref="el" class="thumb-stick" :class="{aim}" :style="{width:`${props.size}px`,height:`${props.size}px`}" role="group" :aria-label="aim?'Joystick de puntería':'Joystick de movimiento'" :data-testid="aim?'aim-stick':'move-stick'" @pointerdown="down" @pointermove="move" @pointerup="release" @pointercancel="release" @lostpointercapture="release"><i class="stick-ring"/><div class="stick-knob" :style="{transform:`translate(${x}px,${y}px)`}"><Crosshair v-if="aim" :size="19"/><Move v-else :size="19"/></div><span>{{aim?'APUNTAR':'MOVER'}}</span></div></template>
