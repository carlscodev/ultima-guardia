<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { operatorSprite, dogSprite, weaponSprite } from '@/engine/Sprites'
import { loadout, defaultOutfit } from '@/stores/profile'
import type { WeaponKind } from '@/types/game'
const props=defineProps<{kind?:'operator'|'dog'|'weapon';weapon?:WeaponKind;color?:string;compact?:boolean}>()
const canvas=ref<HTMLCanvasElement|null>(null)
function draw(){const c=canvas.value?.getContext('2d');if(!c)return;c.clearRect(0,0,180,125);c.imageSmoothingEnabled=false;if(props.kind==='dog')dogSprite(c,85,90,2.8,0,'idle');else if(props.kind==='weapon'){c.save();c.translate(29,63);c.scale(2.8,2.8);weaponSprite(c,props.weapon||loadout.weapon,loadout.outfit.weaponSkin);c.restore()}else{const o=props.color?defaultOutfit():loadout.outfit;if(props.color){o.pieces.torso.color=props.color;o.pieces.head.color=props.color}operatorSprite(c,85,120,2.2,o,loadout.weapon,0,0,false)}}
onMounted(draw);watch(()=>[loadout.outfit,loadout.weapon,props.kind,props.weapon,props.color],draw,{deep:true})
</script>
<template><canvas ref="canvas" width="180" height="125" class="sprite-preview" :class="{compact}" role="img" :aria-label="kind==='dog'?'Atlas, pastor alemán pixel art':kind==='weapon'?'Vista del arma':'Vista del operador'" /></template>
<style scoped>.sprite-preview{display:block;width:100%;height:125px;object-fit:contain;image-rendering:pixelated;background:#101a23}.sprite-preview.compact{height:78px}</style>
