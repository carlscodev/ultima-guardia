import type { WeaponKind } from '@/types/game'
export const WEAPON_IDS: WeaponKind[] = ['rifle','shotgun','pistol','revolver','smg','sniper','lmg','launcher']
export const ARSENAL: Record<WeaponKind, { title: string; category: string; description: string; damage: number; interval: number; spread: number; pellets: number; speed: number; recoil: number; magazine: number; reload: number; range: number; color: string }> = {
  rifle: { title:'M4 · Centinela', category:'Fusil de asalto', description:'Versátil y preciso. Tu última línea de defensa.',damage:29,interval:.19,spread:.026,pellets:1,speed:650,recoil:1.2,magazine:30,reload:1.65,range:350,color:'#7be7d6' },
  shotgun: { title:'K-12 · Brecha',category:'Escopeta',description:'Siete perdigones. Una respuesta contundente a corta distancia.',damage:19,interval:.85,spread:.22,pellets:7,speed:490,recoil:3,magazine:8,reload:2.4,range:200,color:'#ffb454' },
  pistol: { title:'P9 · Vigía',category:'Pistola',description:'Ligera, controlable y rápida de recargar.',damage:31,interval:.29,spread:.018,pellets:1,speed:580,recoil:.7,magazine:16,reload:1,range:270,color:'#a9b6bc' },
  revolver: { title:'R6 · Veredicto',category:'Revólver',description:'Seis oportunidades. Impacto pesado y gran retroceso.',damage:95,interval:.65,spread:.012,pellets:1,speed:720,recoil:2.8,magazine:6,reload:2.1,range:330,color:'#d3a6ed' },
  smg: { title:'VX9 · Avispa',category:'Subfusil',description:'Una tormenta de plomo. Controla la dispersión en ráfagas.',damage:19,interval:.075,spread:.09,pellets:1,speed:590,recoil:.8,magazine:40,reload:1.5,range:240,color:'#7be7d6' },
  sniper: { title:'SRS · Horizonte',category:'Rifle de precisión',description:'Largo alcance. Potencia para quebrar armaduras.',damage:190,interval:1.1,spread:.002,pellets:1,speed:1050,recoil:3,magazine:5,reload:2.5,range:600,color:'#9aa7ff' },
  lmg: { title:'M60 · Bastión',category:'Ametralladora ligera',description:'Ochenta cartuchos para contener a toda la horda.',damage:34,interval:.12,spread:.065,pellets:1,speed:650,recoil:1.7,magazine:80,reload:3.8,range:370,color:'#ffb454' },
  launcher: { title:'GL6 · Eclipse',category:'Lanzagranadas',description:'Explosión de área. Mantén a la horda a distancia.',damage:150,interval:1.25,spread:.035,pellets:1,speed:330,recoil:3.5,magazine:6,reload:3,range:320,color:'#ff6b6b' },
}
export const OPERATORS = [
 {id:'assault',name:'VEGA',role:'Asalto',number:'01',perk:'Munición de impacto',description:'+15% de daño con todas las armas.',color:'#7be7d6'},
 {id:'scout',name:'NOVA',role:'Exploración',number:'02',perk:'Paso ligero',description:'+20% de velocidad de movimiento.',color:'#9aa7ff'},
 {id:'support',name:'CRUZ',role:'Apoyo',number:'03',perk:'Especialista de campo',description:'Recargas un 25% más rápidas.',color:'#ffb454'},
 {id:'survivor',name:'ROOK',role:'Resistencia',number:'04',perk:'Última resistencia',description:'140 de vida máxima en lugar de 100.',color:'#ff8585'},
] as const
export const PALETTE = ['#467f88','#9a6650','#65658b','#a39a7b','#364553','#894c57','#929d9f','#315e50']
export const SKIN_TONES = ['#edc9a2','#d4a579','#ae7754','#81523e','#553b32']
export const SLOTS = [
 {id:'head',label:'Cabeza',variants:['Casco táctico','Boina','Sin casco']},
 {id:'face',label:'Rostro',variants:['Visor','Descubierto','Máscara']},
 {id:'torso',label:'Torso',variants:['Chaleco pesado','Chaqueta','Placas ligeras']},
 {id:'arms',label:'Brazos',variants:['Mangas largas','Mangas cortas','Protecciones']},
 {id:'gloves',label:'Guantes',variants:['Tácticos','Sin dedos','Sin guantes']},
 {id:'waist',label:'Cintura',variants:['Cinturón','Cartucheras','Arnés']},
 {id:'legs',label:'Piernas',variants:['Pantalón cargo','Shorts','Rodilleras']},
 {id:'boots',label:'Botas',variants:['Combate','Ligeras','Reforzadas']},
 {id:'back',label:'Espalda',variants:['Mochila','Radio','Sin accesorio']},
] as const
export type Slot = typeof SLOTS[number]['id']
export interface Outfit { skin: string; pieces: Record<Slot, { variant: number; color: string }>; weaponSkin: string }
export type PowerKind = 'health'|'armor'|'ammo'|'speed'|'damage'|'reload'|'shield'|'signal'
export const POWERS: Record<PowerKind, {title:string; icon:string; color:string; description:string}> = {
 health:{title:'Botiquín',icon:'+',color:'#ff8585',description:'+35 de vida'},armor:{title:'Armadura',icon:'A',color:'#9aa7ff',description:'+45 de protección'},ammo:{title:'Munición',icon:'M',color:'#ffb454',description:'Reserva de todas las armas restaurada'},speed:{title:'Adrenalina',icon:'V',color:'#7be7d6',description:'+45% velocidad · 12 s'},damage:{title:'Furia',icon:'D',color:'#ff956b',description:'+60% daño · 12 s'},reload:{title:'Manos rápidas',icon:'R',color:'#f6d365',description:'Recarga al doble de velocidad · 15 s'},shield:{title:'Escudo',icon:'E',color:'#65cfff',description:'Inmunidad · 8 s'},signal:{title:'Señal de apoyo',icon:'S',color:'#c8b5ff',description:'Convoca dos aliados durante 25 s'},
}
export const DISTRICTS = [{name:'Las Jacarandas',type:'Residencial',color:'#7be7d6',code:'01',description:'Calles estrechas. Ventanas que aún guardan luz.'},{name:'Avenida Central',type:'Comercial',color:'#ffb454',code:'02',description:'Neón, escaparates y demasiados puntos ciegos.'},{name:'Puerto Ceniza',type:'Industrial',color:'#9aa7ff',code:'03',description:'Acero, vapor y la última ruta de extracción.'}]
