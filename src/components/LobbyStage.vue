<script setup lang="ts">
import { onBeforeUnmount,onMounted,ref } from 'vue'
import { CityScene } from '@/engine/CityScene'
import { operatorSprite,dogSprite } from '@/engine/Sprites'
import { loadout,settings } from '@/stores/profile'
const canvas=ref<HTMLCanvasElement|null>(null)
let frame=0,last=0,city:CityScene|null=null
function paint(now:number){frame=requestAnimationFrame(paint);if(now-last<50)return;last=now;const el=canvas.value,c=el?.getContext('2d');if(!el||!c||!city)return;const w=960,h=620;c.fillStyle='#131e2b';c.fillRect(0,0,w,h);c.imageSmoothingEnabled=false;const time=now/1000;const v={width:w,height:h,scale:.94,cameraX:610+loadout.district*1200,cameraY:555};city.drawGround(c,v);city.drawShadows(c,v);for(const p of city.props)city.drawProp(c,p,v,{x:-5000,y:0});city.drawAmbient(c,v,time,settings.reducedFlashes,settings.lighting,settings.particles);c.fillStyle='#0b14236b';c.fillRect(0,0,w,h)
 c.fillStyle='#102a36';c.beginPath();c.ellipse(w*.53,h*.83,180,43,0,0,Math.PI*2);c.fill();c.strokeStyle='#57968c55';c.lineWidth=1;c.stroke();c.strokeStyle='#7be7d62b';c.beginPath();c.ellipse(w*.53,h*.83,205,53,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#040e1c77';c.beginPath();c.ellipse(w*.51+14,h*.81,55,12,0,0,Math.PI*2);c.fill();operatorSprite(c,w*.51,h*.81,4.9,loadout.outfit,loadout.weapon,-.1,time,false)
 if(loadout.dog){c.fillStyle='#040e1c77';c.beginPath();c.ellipse(w*.68,h*.83,55,12,0,0,Math.PI*2);c.fill();dogSprite(c,w*.68,h*.82,2.9,time,'idle')}
 if(settings.particles>30&&!settings.reducedFlashes)city.drawRain(c,v,time,35)
 c.strokeStyle='#aecbd327';c.lineWidth=1;for(const [x,y,sx,sy] of [[27,27,1,1],[w-27,27,-1,1],[27,h-27,1,-1],[w-27,h-27,-1,-1]]){c.beginPath();c.moveTo(x!+20*sx!,y!);c.lineTo(x!,y!);c.lineTo(x!,y!+20*sy!);c.stroke()}
}
onMounted(()=>{city=new CityScene();frame=requestAnimationFrame(paint)});onBeforeUnmount(()=>{cancelAnimationFrame(frame);city=null})
</script>
<template><canvas ref="canvas" width="960" height="620" class="lobby-stage" role="img" aria-label="Vista en tiempo real de tu operador y Atlas en la ciudad" data-testid="lobby-stage" /></template>
<style scoped>.lobby-stage{width:100%;height:100%;object-fit:cover;display:block;background:#131e2b;image-rendering:pixelated}</style>
