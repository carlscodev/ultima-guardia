import { DIALOGUE_AUDIO, type DialogueAudioId } from '@/audio/dialogues'
import { SFX_AUDIO, type SfxAudioId } from '@/audio/sfx'
import type { WeaponKind } from '@/types/game'

type AudioChannel = 'effects' | 'ambient' | 'radio'
type ImpactKind = 'zombie' | 'concrete' | 'metal'

export class ProceduralAudio {
 private context:AudioContext|null=null
 private master:GainNode|null=null
 private filter:BiquadFilterNode|null=null
 private noise:AudioBuffer|null=null
 private muted=false
 private muffled=false
 private volumes={effects:.6,ambient:.35,radio:.5}
 private nodes=0
 private readonly dialogueClips=new Map<DialogueAudioId,HTMLAudioElement>()
 private currentVoice:HTMLAudioElement|null=null
 private readonly samples=new Map<SfxAudioId,AudioBuffer>()
 private sampleLoading:Promise<void>|null=null
 private lastImpact=-100
 private lastCasing=-100
 private lastEmpty=-100
 private lastHurt=-100
 private lastZombie=-100
 private lastAmbient=-100

 constructor(){
  if(typeof Audio==='undefined')return
  for(const [id,source] of Object.entries(DIALOGUE_AUDIO) as [DialogueAudioId,string][]){
   const clip=new Audio()
   clip.preload='auto'
   clip.src=source
   clip.addEventListener('ended',()=>{if(this.currentVoice===clip)this.currentVoice=null})
   clip.load()
   this.dialogueClips.set(id,clip)
  }
 }

 setMuted(muted:boolean){
  this.muted=muted
  if(this.master&&this.context)this.master.gain.setTargetAtTime(muted?0:.2,this.context.currentTime,.03)
  this.updateVoiceVolume()
 }

 volumesSet(effects:number,ambient:number,radio:number){
  this.volumes={effects:effects/100,ambient:ambient/100,radio:radio/100}
  this.updateVoiceVolume()
 }

 async unlock(){
  if(!this.context){
   this.context=new AudioContext()
   this.master=this.context.createGain()
   this.master.gain.value=this.muted?0:.2
   this.filter=this.context.createBiquadFilter()
   this.filter.type='lowpass'
   this.filter.frequency.value=18000
   this.filter.connect(this.master).connect(this.context.destination)
   this.noise=this.context.createBuffer(1,this.context.sampleRate,this.context.sampleRate)
   const data=this.noise.getChannelData(0)
   for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1
  }
  await this.context.resume()
  this.loadSamples()
 }

 private loadSamples(){
  if(!this.context||this.sampleLoading)return
  const context=this.context
  const entries=Object.entries(SFX_AUDIO) as [SfxAudioId,string][]
  this.sampleLoading=Promise.all(entries.map(async([id,url])=>{
   try{
    const response=await fetch(url)
    if(!response.ok)throw new Error(`HTTP ${response.status}`)
    this.samples.set(id,await context.decodeAudioData(await response.arrayBuffer()))
   }catch(error){
    console.warn(`No se pudo cargar el efecto ${id}`,error)
   }
  })).then(()=>undefined)
 }

 setMuffled(active:boolean){
  this.muffled=active
  if(this.context&&this.filter)this.filter.frequency.setTargetAtTime(active?600:18000,this.context.currentTime,.1)
  this.updateVoiceVolume()
 }

 dialogue(id:DialogueAudioId){
  const clip=this.dialogueClips.get(id)
  if(!clip)return
  if(this.currentVoice&&this.currentVoice!==clip){this.currentVoice.pause();this.currentVoice.currentTime=0}
  this.currentVoice=clip
  clip.currentTime=0
  this.updateVoiceVolume()
  void clip.play().catch(()=>{if(this.currentVoice===clip)this.currentVoice=null})
 }

 stopDialogue(){
  if(!this.currentVoice)return
  this.currentVoice.pause()
  this.currentVoice.currentTime=0
  this.currentVoice=null
 }

 private updateVoiceVolume(){
  if(!this.currentVoice)return
  this.currentVoice.muted=this.muted
  this.currentVoice.volume=Math.max(0,Math.min(1,this.volumes.radio*(this.muffled?.35:1)))
 }

 private playSample(id:SfxAudioId,volume=1,channel:AudioChannel='effects',rate=1,delay=0){
  const context=this.context,filter=this.filter,buffer=this.samples.get(id)
  if(!context||!filter||!buffer||this.muted||this.nodes>32)return false
  const source=context.createBufferSource(),gain=context.createGain()
  source.buffer=buffer
  source.playbackRate.value=rate
  gain.gain.value=Math.max(.0001,volume*this.volumes[channel])
  source.connect(gain).connect(filter)
  source.start(context.currentTime+delay)
  this.nodes++
  source.onended=()=>{source.disconnect();gain.disconnect();this.nodes--}
  return true
 }

 private hiss(f:number,duration:number,vol:number,channel:AudioChannel='effects'){
  if(!this.context||!this.filter||!this.noise||this.nodes>32||this.muted)return
  const context=this.context,now=context.currentTime,source=context.createBufferSource(),band=context.createBiquadFilter(),gain=context.createGain()
  source.buffer=this.noise
  band.type='bandpass';band.frequency.value=f;band.Q.value=.8
  gain.gain.setValueAtTime(Math.max(.0001,vol*this.volumes[channel]),now)
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration)
  source.connect(band).connect(gain).connect(this.filter)
  source.start(now);source.stop(now+duration);this.nodes++
  source.onended=()=>{source.disconnect();band.disconnect();gain.disconnect();this.nodes--}
 }

 shot(kind:boolean|string){
  const name=typeof kind==='boolean'?(kind?'shotgun':'rifle'):kind
  const samples:Record<string,SfxAudioId>={rifle:'shot-rifle',shotgun:'shot-shotgun',pistol:'shot-pistol',revolver:'shot-revolver',smg:'shot-smg',sniper:'shot-sniper',lmg:'shot-lmg',launcher:'shot-launcher'}
  const volumes:Record<string,number>={rifle:.75,shotgun:.9,pistol:.65,revolver:.82,smg:.55,sniper:.95,lmg:.75,launcher:.8}
  const sample=samples[name]
  if(sample&&this.playSample(sample,volumes[name]??.75))return
  const types:Record<string,[number,number,number]>={pistol:[1600,.08,.5],revolver:[560,.15,.85],rifle:[1100,.075,.5],shotgun:[480,.19,.9],smg:[2100,.055,.35],sniper:[330,.22,1],lmg:[780,.1,.65],launcher:[170,.3,.9]}
  const selected=types[name]||types.rifle!
  this.hiss(selected[0],selected[1],selected[2])
 }

 reload(kind?:WeaponKind,rate=1){
  const ids:Record<WeaponKind,SfxAudioId>={rifle:'reload-rifle',shotgun:'reload-shotgun',pistol:'reload-pistol',revolver:'reload-revolver',smg:'reload-smg',sniper:'reload-sniper',lmg:'reload-lmg',launcher:'reload-launcher'}
  const id=kind?ids[kind]:undefined
  if(!id||!this.playSample(id,.8,'effects',rate))this.hiss(2800,.11,.25)
 }

 switchWeapon(){if(!this.playSample('weapon-switch',.55))this.hiss(1900,.08,.16)}

 empty(){
  const now=this.context?.currentTime??0
  if(now-this.lastEmpty<.45)return
  this.lastEmpty=now
  if(!this.playSample('empty',.7))this.tone(650,420,.05,.08)
 }

 ejectCasing(kind:WeaponKind){
  if(kind==='launcher')return
  const now=this.context?.currentTime??0
  if(now-this.lastCasing<.12)return
  this.lastCasing=now
  const id:SfxAudioId=kind==='shotgun'?'casing-shotgun':'casing-brass'
  this.playSample(id,.28,'effects',.92+Math.random()*.16,.045)
 }

 impact(kind:ImpactKind='zombie'){
  const now=this.context?.currentTime??0
  if(now-this.lastImpact<.04)return
  this.lastImpact=now
  const id:SfxAudioId=kind==='metal'?'impact-metal':kind==='concrete'?'impact-concrete':'impact-zombie'
  if(!this.playSample(id,kind==='zombie'?.45:.55))this.tone(120,48,.06,.1)
  if(kind==='metal'&&Math.random()<.28)this.playSample('ricochet',.32,'effects',.92+Math.random()*.16,.02)
 }

 pulse(){if(!this.playSample('emp-pulse',.8))this.tone(160,38,.45,.35)}
 explosion(){if(!this.playSample('launcher-explosion',1))this.tone(100,36,.55,.5)}

 playerHurt(dead:boolean,damage:number){
  const now=this.context?.currentTime??0
  if(dead){this.lastHurt=now;this.playSample('player-death',.7);return}
  if(now-this.lastHurt<.9)return
  this.lastHurt=now
  if(damage>=20&&Math.random()<.45)this.playSample('player-cough',.5)
  else this.playSample((`player-hurt-${1+Math.floor(Math.random()*3)}`) as SfxAudioId,.58)
 }

 bark(){this.tone(260,85,.16,.2);this.hiss(600,.1,.2)}
 spark(){this.hiss(3500,.12,.25,'ambient')}
 radio(){this.hiss(2200,.09,.22,'radio');this.tone(900,1300,.09,.09,'radio')}

 roar(ratio:number){
  const now=this.context?.currentTime??0
  if(now-this.lastZombie<1.7)return
  this.lastZombie=now
  const id=(`zombie-growl-${1+Math.floor(Math.random()*5)}`) as SfxAudioId
  if(!this.playSample(id,Math.max(.15,.65*(1-ratio)),'ambient',.9+Math.random()*.18))this.tone(72,41,.35,.16*(1-ratio),'ambient')
 }

 ambientDrone(){
  const now=this.context?.currentTime??0
  if(now-this.lastAmbient<12||Math.random()>.45)return
  this.lastAmbient=now
  this.playSample('ambient-drone',.28,'ambient',.94+Math.random()*.1)
 }

 wind(){this.hiss(180,.8,.13,'ambient')}

 private tone(from:number,to:number,duration:number,volume:number,channel:AudioChannel='effects'){
  if(!this.context||!this.filter||this.nodes>32||this.muted)return
  const context=this.context,now=context.currentTime,oscillator=context.createOscillator(),gain=context.createGain()
  oscillator.type='sawtooth'
  oscillator.frequency.setValueAtTime(from,now)
  oscillator.frequency.exponentialRampToValueAtTime(to,now+duration)
  gain.gain.setValueAtTime(Math.max(.0001,volume*this.volumes[channel]),now)
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration)
  oscillator.connect(gain).connect(this.filter)
  oscillator.start(now);oscillator.stop(now+duration);this.nodes++
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.nodes--}
 }

 dispose(){
  this.stopDialogue()
  for(const clip of this.dialogueClips.values()){clip.removeAttribute('src');clip.load()}
  this.dialogueClips.clear();this.samples.clear();this.sampleLoading=null
  void this.context?.close();this.context=null
 }
}
