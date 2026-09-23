import { reactive, watch } from 'vue'
import { ARSENAL, OPERATORS, PALETTE, SKIN_TONES, SLOTS, type Outfit } from '@/data/content'
import type { WeaponKind } from '@/types/game'
import type { GameMode } from '@/engine/systems/Campaign'
export interface Settings { quality:'low'|'balanced'|'high'; auto:boolean; resolution:number; shadows:boolean; lighting:boolean; particles:number; bodies:number; aa:'crisp'|'smooth'; fps:30|60; showFps:boolean; sensitivity:number; controlSize:number; controlOffset:number; leftHanded:boolean; aimAssist:boolean; autoFire:boolean; shake:number; effectsVolume:number; ambientVolume:number; radioVolume:number; musicVolume:number; subtitles:boolean; blood:number; reducedFlashes:boolean }
export interface Loadout { operator:string; weapon:WeaponKind; mode:GameMode; dog:boolean; dogRadius:5|10|15; dogOrder:'follow'|'defend'|'attack'; outfit:Outfit; district:number }
export const defaultOutfit = (): Outfit => ({skin:SKIN_TONES[1]!,weaponSkin:'#93a4ad',pieces:Object.fromEntries(SLOTS.map(s=>[s.id,{variant:0,color:s.id==='torso'?'#467f88':s.id==='head'?'#467f88':s.id==='legs'?'#364553':'#364553'}])) as Outfit['pieces']})
export const defaultSettings = ():Settings => ({quality:'balanced',auto:true,resolution:.85,shadows:true,lighting:true,particles:70,bodies:18,aa:'crisp',fps:60,showFps:false,sensitivity:1,controlSize:110,controlOffset:18,leftHanded:false,aimAssist:true,autoFire:true,shake:40,effectsVolume:60,ambientVolume:35,radioVolume:50,musicVolume:30,subtitles:true,blood:50,reducedFlashes:false})
const initial: Loadout = {operator:'assault',weapon:'rifle',mode:'campaign',dog:true,dogRadius:10,dogOrder:'follow',outfit:defaultOutfit(),district:0}
const KEY = 'dead-city-v3-profile'
export const persistence = reactive({error:''})
function read(): {loadout?:Loadout;settings?:Settings;outfits?:Outfit[];records?:{kills:number;wave:number;wins:number}} { try { return JSON.parse(localStorage.getItem(KEY)||'{}') || {} } catch { return {} } }
const saved = read()
function outfitValid(o:Outfit|undefined):Outfit { const result=defaultOutfit(); if (!o) return result; if(SKIN_TONES.includes(o.skin)) result.skin=o.skin; if(/^#[0-9a-f]{6}$/i.test(o.weaponSkin||'')) result.weaponSkin=o.weaponSkin; for(const slot of SLOTS) { const p=o.pieces?.[slot.id]; if(p) result.pieces[slot.id]={variant:Math.max(0,Math.min(2,Number(p.variant)||0)),color:PALETTE.includes(p.color)?p.color:result.pieces[slot.id].color} } return result }
const l=saved.loadout
export const loadout=reactive<Loadout>({...initial,...(l?{operator:OPERATORS.some(o=>o.id===l.operator)?l.operator:initial.operator,weapon:l.weapon in ARSENAL?l.weapon:'rifle',mode:l.mode==='infinite'?'infinite':'campaign',dog:typeof l.dog==='boolean'?l.dog:true,dogRadius:[5,10,15].includes(l.dogRadius)?l.dogRadius:10,dogOrder:['follow','defend','attack'].includes(l.dogOrder)?l.dogOrder:'follow',district:Math.max(0,Math.min(2,l.district||0)),outfit:outfitValid(l.outfit)}:{})})
const defaults=defaultSettings(); const loadedSettings={...defaults}
for(const key of Object.keys(defaults) as (keyof Settings)[]) { const val=saved.settings?.[key]; if(typeof val===typeof defaults[key]) (loadedSettings as unknown as Record<string,unknown>)[key]=val }
const ranges:Partial<Record<keyof Settings,[number,number]>>={resolution:[.5,1.25],particles:[0,100],bodies:[0,40],sensitivity:[.5,2],controlSize:[85,125],controlOffset:[8,40],shake:[0,100],effectsVolume:[0,100],ambientVolume:[0,100],radioVolume:[0,100],musicVolume:[0,100],blood:[0,100]}
for(const [key,range] of Object.entries(ranges)) {const k=key as keyof Settings;const n=Number(loadedSettings[k]); (loadedSettings as unknown as Record<string,unknown>)[k]=Number.isFinite(n)?Math.max(range[0],Math.min(range[1],n)):defaults[k]}
if(!['low','balanced','high'].includes(loadedSettings.quality)) loadedSettings.quality='balanced'; if(!['crisp','smooth'].includes(loadedSettings.aa)) loadedSettings.aa='crisp'; if(![30,60].includes(loadedSettings.fps)) loadedSettings.fps=60
export const settings=reactive<Settings>(loadedSettings)
export const outfits=reactive<Outfit[]>((saved.outfits||[]).slice(0,3).map(outfitValid))
export const records=reactive({kills:Math.max(0,Number(saved.records?.kills)||0),wave:Math.max(0,Number(saved.records?.wave)||0),wins:Math.max(0,Number(saved.records?.wins)||0)})
export function persist():void {try{localStorage.setItem(KEY,JSON.stringify({loadout,settings,outfits,records}));persistence.error=''}catch{persistence.error='No se pudo guardar en este navegador. Tus cambios siguen activos durante esta sesión.'}}
watch([loadout,settings,outfits,records],persist,{deep:true})
export function preset(q:Settings['quality']):void { Object.assign(settings,{quality:q,resolution:q==='low'?.6:q==='high'?1:.85,particles:q==='low'?25:q==='high'?100:70,bodies:q==='low'?6:q==='high'?30:18,shadows:q!=='low',lighting:q!=='low'}) }
export function resetSettings():void {Object.assign(settings,defaultSettings())}
