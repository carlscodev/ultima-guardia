import type { Outfit } from '@/data/content'
import type { WeaponKind, ZombieKind } from '@/types/game'
export function weaponSprite(ctx:CanvasRenderingContext2D,kind:WeaponKind,color:string,flash=false):void {
 const r=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
 const small=kind==='pistol'||kind==='revolver'; const long=kind==='sniper'||kind==='lmg'; const length=small?17:long?40:31
 r(0,-3,small?7:10,6,'#17232b'); r(7,-4,length-10,7,color); r(9,-4,length-13,2,'#d1dade');r(length-2,-2,8,3,'#263640');r(9,3,4,7,'#16232c')
 if(!small){r(-6,-2,9,4,'#40515a');r(15,3,5,8,'#25333d');r(17,3,2,7,'#536673');r(13,-6,12,2,'#111c25')}
 if(kind==='sniper'){r(14,-9,13,4,'#334858');r(23,-8,3,2,'#7be7d6')}
 if(kind==='shotgun'){r(18,1,10,4,'#8f644d');r(19,2,1,3,'#d5a173')}
 if(kind==='lmg'){r(15,2,10,10,'#62664c');r(18,4,2,6,'#bda75a')}
 if(kind==='launcher'){r(11,-7,18,12,'#4f6270');r(11,-6,18,2,'#92a2ad');r(14,3,4,6,'#273542')}
 if(kind==='revolver'){r(7,-4,7,8,'#80909a');r(9,-3,1,6,'#18232c')}
 if(flash){r(length+6,-4,7,8,'#ffb454');r(length+8,-1,12,3,'#fff2cd')}
}
export function operatorSprite(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,outfit:Outfit,weapon:WeaponKind,angle=0,time=0,moving=false,flash=false,reload=0):void {
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size)
 const p=outfit.pieces;const skin=outfit.skin;const step=moving?Math.sin(time*12)*2.3:0;const breath=moving?0:Math.sin(time*2)*.35
 const r=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y+breath),w,h)}
 if(p.back.variant!==2){r(-12,-31,8,19,'#12222b');r(-11,-30,7,16,p.back.color);r(-10,-27,3,10,'#a6afb044');if(p.back.variant===1)r(-11,-43,1,14,'#99b5bd')}
 r(-7,-16+step,6,13,p.legs.color);r(2,-16-step,6,13,p.legs.color);r(-7,-15+step,2,12,'#00000033');r(6,-15-step,2,12,'#00000044')
 if(p.legs.variant===1){r(-6,-7+step,5,5,skin);r(2,-7-step,5,5,skin)}
 if(p.legs.variant===2){r(-7,-10+step,6,4,'#92a2ad');r(2,-10-step,6,4,'#72818c')}
 r(-8,-3+step,8,4,p.boots.color);r(2,-3-step,9,4,p.boots.color);r(-8,0+step,8,2,'#0b141b');r(2,0-step,9,2,'#0b141b');if(p.boots.variant===2){r(-8,-3+step,8,1,'#a6b4ba');r(2,-3-step,9,1,'#a6b4ba')}
 r(-9,-31,18,18,'#15242d');r(-8,-32,16,18,p.torso.color);r(-7,-31,3,15,'#bed2d136');r(5,-31,3,16,'#00000036');
 if(p.torso.variant!==1){r(-6,-28,12,10,'#263b48');r(-5,-27,10,2,'#789098');r(-5,-23,4,5,'#46606b');r(1,-23,4,5,'#46606b');r(-4,-21,2,1,'#afc0bc');if(p.torso.variant===0){r(-8,-31,3,9,'#6e8486');r(5,-31,3,9,'#53676d')}}
 else{r(-1,-31,1,16,'#abb7b9');r(-5,-29,4,4,'#233c49')}
 r(-12,-30,4,13,p.arms.color);r(8,-30,4,13,p.arms.color);r(-12,-30,4,3,'#a5c3c43d');r(9,-25,2,3,'#ffb454')
 if(p.arms.variant===1){r(-12,-24,4,8,skin);r(8,-24,4,8,skin)}
 if(p.arms.variant===2){r(-13,-28,5,7,'#536775');r(8,-28,5,7,'#536775')}
 r(-12,-18,4,5,p.gloves.variant===2?skin:p.gloves.color);r(8,-18,4,5,p.gloves.variant===2?skin:p.gloves.color)
 if(p.gloves.variant===1){r(-12,-14,4,2,skin);r(8,-14,4,2,skin)}
 r(-8,-16,16,3,p.waist.color);r(-1,-16,3,2,'#baa977');if(p.waist.variant===1){r(-10,-16,4,6,p.waist.color);r(6,-16,4,6,p.waist.color)}if(p.waist.variant===2)r(-2,-16,2,6,'#a5afb0')
 r(-4,-37,8,6,skin);r(-6,-45,12,11,skin);r(-6,-44,2,8,'#00000029');r(-3,-37,6,2,'#00000024')
 if(p.head.variant===0){r(-7,-49,14,8,p.head.color);r(-5,-50,10,2,'#99b6b755');r(-8,-43,16,3,'#1b2e39');r(-7,-46,3,5,'#3b535c');r(4,-46,3,5,'#3b535c');r(-2,-47,4,2,'#d8b374')}
 if(p.head.variant===1){r(-7,-48,13,6,p.head.color);r(-5,-50,9,3,p.head.color);r(1,-47,3,2,'#ffb454')}
 if(p.head.variant===2){r(-6,-46,12,3,'#332924');r(-6,-44,2,5,'#332924')}
 if(p.face.variant===0){r(-5,-41,10,4,'#172b38');r(-4,-41,8,1,'#79d7e0');r(2,-40,2,1,'#caf7ec')}
 if(p.face.variant===1){r(-4,-40,2,1,'#1c2429');r(2,-40,2,1,'#1c2429')}
 if(p.face.variant===2){r(-5,-40,10,6,'#263744');r(-2,-38,4,4,'#82949c')}
 ctx.save();ctx.translate(3,-23);ctx.rotate(reload>0?.65:angle);weaponSprite(ctx,weapon,outfit.weaponSkin,flash);ctx.restore();ctx.restore()
}
export function dogSprite(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,time:number,status:string,facing=1):void {
 ctx.save();ctx.translate(x,y);ctx.scale(size*(facing<0?-1:1),size);if(status==='recovering')ctx.rotate(-.18)
 const r=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 const run=status==='running'||status==='attacking';const step=run?Math.sin(time*16)*3:0;const hurt=status==='hurt';const tan=hurt?'#f8dfc5':'#b8874f'
 r(-15,-15,23,11,tan);r(-12,-16,15,8,'#28303b');r(-10,-15,11,4,'#41414a');r(-14,-6,4,7+step,tan);r(-7,-6,3,7-step,'#825633');r(3,-6,4,7-step,tan);r(8,-7,3,8+step,'#825633');r(-15,0+step,5,2,'#302e2f');r(2,0-step,5,2,'#302e2f')
 r(-20,-17,7,4,'#91643e');r(-23,-20+Math.sin(time*5)*2,5,5,'#313239');r(5,-21,9,13,tan);r(5,-22,3,8,'#3c3532');r(7,-29,4,9,'#262d35');r(13,-28,3,8,'#262d35');r(8,-27,1,5,'#b58158');r(9,-23,8,10,tan);r(13,-17,10,5,'#a27345');r(20,-17,4,4,'#252c32');r(14,-21,2,2,'#151f24');r(14,-21,1,1,'#ffe0a8');r(5,-12,10,3,'#2fd3c7');r(10,-10,2,3,'#ffd08a');
 if(status==='attacking'){r(18,-11,5,3,'#ca7771');r(19,-12,4,1,'#ede8dd')}
 if(status==='recovering'){ctx.fillStyle='#7be7d6';ctx.font='9px sans-serif';ctx.fillText('+',0,-32)}
 ctx.restore()
}
export const ZOMBIE_COLORS:Record<ZombieKind,string>={walker:'#665b57',runner:'#694238',tank:'#58494a',armored:'#3e515b',toxic:'#66754a',boss:'#713b3d'}
const ZOMBIE_PALETTES:Record<ZombieKind,{cloth:string;dark:string;skin:string;skinDark:string;blood:string;wound:string}>={
 walker:{cloth:'#5f5a56',dark:'#292d30',skin:'#8d9186',skinDark:'#535b55',blood:'#702f35',wound:'#3b2024'},
 runner:{cloth:'#75483f',dark:'#2c292c',skin:'#9b887b',skinDark:'#584c49',blood:'#842e32',wound:'#402024'},
 tank:{cloth:'#51484a',dark:'#272a2d',skin:'#846f69',skinDark:'#4b3d3d',blood:'#76282e',wound:'#351b20'},
 armored:{cloth:'#35434c',dark:'#1d252b',skin:'#777f79',skinDark:'#424b48',blood:'#672b31',wound:'#321d22'},
 toxic:{cloth:'#6c784b',dark:'#303827',skin:'#9da76e',skinDark:'#5e6845',blood:'#685932',wound:'#34351f'},
 boss:{cloth:'#5c383b',dark:'#251f22',skin:'#8f5e5c',skinDark:'#4c3033',blood:'#8f252d',wound:'#35171b'},
}
function renderZombieVector(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,kind:ZombieKind,time:number,id:number,flash=false):void {
 const size=s*(kind==='boss'?2.25:kind==='tank'?1.48:kind==='runner'?.94:kind==='armored'?1.08:1)
 const palette=ZOMBIE_PALETTES[kind],variant=id%3
 const clothVariants:Record<ZombieKind,string[]>={walker:['#625b55','#4f5960','#665149'],runner:['#75483f','#56404a','#674b37'],tank:['#51484a','#4a4540','#554146'],armored:['#35434c','#3d464a','#31434b'],toxic:['#6c784b','#596d42','#747044'],boss:['#5c383b','#623238','#51383d']}
 const cloth=clothVariants[kind][variant]!,phase=time*(kind==='runner'?12:kind==='boss'?4.2:7)+id*.83,stride=Math.sin(phase),bob=Math.abs(Math.sin(phase))*.65
 const bulk=kind==='tank'||kind==='boss',bodyWidth=bulk?22:kind==='armored'?18:15,skin=palette.skin
 ctx.save();ctx.translate(x,y-bob);ctx.scale(size,size);if(flash)ctx.filter='brightness(1.9) saturate(.45)'
 ctx.rotate((kind==='runner'?.045:0)+Math.sin(id*2.13)*.018)
 const ellipse=(cx:number,cy:number,rx:number,ry:number,fill:string,stroke?:string,width=.6)=>{ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
 const poly=(points:number[][],fill:string,stroke?:string,width=.6)=>{ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px!,py!):ctx.moveTo(px!,py!));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
 const end=(px:number,py:number,length:number,angle:number)=>({x:px-Math.sin(angle)*length,y:py+Math.cos(angle)*length})
 const segment=(px:number,py:number,length:number,width:number,angle:number,color:string,shade:string)=>{ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.lineCap='round';ctx.strokeStyle=shade;ctx.lineWidth=width+1.2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,length);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(-width*.12,0);ctx.lineTo(-width*.12,length);ctx.stroke();ctx.strokeStyle='#ffffff22';ctx.lineWidth=Math.max(.45,width*.14);ctx.beginPath();ctx.moveTo(-width*.25,1);ctx.lineTo(-width*.25,length-1);ctx.stroke();ctx.restore()}
 const drawLeg=(side:number)=>{const hipX=side*(bodyWidth*.23),walk=stride*side*(kind==='runner'?.3:.2),thighAngle=walk,thigh=bulk?12:11;segment(hipX,-18,thigh,bulk?6.5:5.2,thighAngle,palette.dark,'#171b1e');const knee=end(hipX,-18,thigh,thighAngle),shinAngle=-walk*.75;segment(knee.x,knee.y-1,10,bulk?5.8:4.5,shinAngle,variant===1?'#3f4140':palette.dark,'#15191c');const foot=end(knee.x,knee.y-1,10,shinAngle);ellipse(foot.x+side*1.4,foot.y+.2,bulk?4.5:3.6,1.8,'#171b1e','#090c0e',.5)}
 const drawArm=(side:number)=>{const shoulderX=side*(bodyWidth*.48),aggression=kind==='runner'?.42:bulk?.16:0,armSwing=-stride*side*.2,upperAngle=side*(aggression+armSwing),upper=bulk?11:10;segment(shoulderX,-32,upper,bulk?6.8:4.8,upperAngle,cloth,palette.dark);const elbow=end(shoulderX,-32,upper,upperAngle),foreAngle=upperAngle+side*(kind==='runner'?.38:.13);segment(elbow.x,elbow.y-1,bulk?10:9,bulk?5.7:3.9,foreAngle,skin,palette.skinDark);const hand=end(elbow.x,elbow.y-1,bulk?10:9,foreAngle);ellipse(hand.x,hand.y,bulk?3.3:2.4,bulk?3.8:3,skin,palette.skinDark,.55);ctx.strokeStyle=palette.skinDark;ctx.lineWidth=.45;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(hand.x+n*.7,hand.y+1);ctx.lineTo(hand.x+n*.9,hand.y+3.4);ctx.stroke()}}
 drawLeg(-1);drawLeg(1);drawArm(-1);drawArm(1)
 poly([[-bodyWidth*.52,-33],[-bodyWidth*.28,-36],[bodyWidth*.27,-36],[bodyWidth*.53,-32],[bodyWidth*.43,-18],[bodyWidth*.2,-16],[3,-17],[0,-15],[-4,-17],[-bodyWidth*.42,-16]],cloth,palette.dark,.8)
 poly([[1,-35],[bodyWidth*.28,-34],[bodyWidth*.43,-31],[bodyWidth*.34,-19],[4,-17]],'#00000035')
 ctx.strokeStyle='#d6d0c124';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(-bodyWidth*.3,-33);ctx.lineTo(-bodyWidth*.2,-20);ctx.stroke()
 if(variant===0){poly([[-bodyWidth*.44,-25],[-2,-26],[-4,-21],[-bodyWidth*.38,-20]],'#171d2066');ctx.strokeStyle='#c6b8a328';ctx.beginPath();ctx.moveTo(-bodyWidth*.4,-24);ctx.lineTo(-3,-23);ctx.stroke()}
 if(variant===1){ctx.strokeStyle='#17191c';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-2,-35);ctx.lineTo(1,-17);ctx.stroke();ellipse(-4,-27,1.4,2.5,palette.blood)}
 if(variant===2){poly([[bodyWidth*.12,-31],[bodyWidth*.44,-29],[bodyWidth*.35,-24],[bodyWidth*.05,-25]],palette.skinDark);ctx.strokeStyle=palette.blood;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bodyWidth*.1,-27);ctx.lineTo(bodyWidth*.36,-25);ctx.stroke()}
 if(kind==='armored'){
  poly([[-8.5,-34],[8.5,-34],[7.2,-19],[0,-17],[-7.4,-20]],'#273741','#11191e',1);poly([[-6.7,-32],[-1,-33],[-1,-20],[-6,-21]],'#566c78','#1b252b',.6);poly([[.5,-33],[6.8,-31],[5.9,-21],[.5,-20]],'#3c5260','#1b252b',.6);ellipse(-9.5,-31,4,3,'#4c626d','#202b31');ellipse(9.5,-31,4,3,'#405660','#202b31')
 }
 if(kind==='toxic'){
  ctx.strokeStyle='#a5bc65';ctx.lineWidth=1.1;ctx.setLineDash([1.4,1]);ctx.beginPath();ctx.moveTo(-7,-33);ctx.lineTo(-6,-18);ctx.stroke();ctx.setLineDash([]);ellipse(-4,-24,2.5,3.2,'#b6ca63','#59672f');ellipse(4,-29,1.8,2.2,'#c4d876','#66743a')
 }
 if(bulk){ctx.strokeStyle='#b48e8638';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-bodyWidth*.31,-31);ctx.bezierCurveTo(-bodyWidth*.12,-28,-bodyWidth*.15,-22,-bodyWidth*.25,-19);ctx.moveTo(bodyWidth*.3,-31);ctx.bezierCurveTo(bodyWidth*.08,-28,bodyWidth*.16,-22,bodyWidth*.25,-19);ctx.stroke();ellipse(0,-25,2.4,4,palette.wound,palette.blood,.7)}
 segment(0,-38,4.8,bulk?5.5:4.1,0,skin,palette.skinDark)
 if(kind==='toxic')ellipse(0,-43,8.1,9,'#596c40','#29351f',1)
 const headTilt=Math.sin(id*1.73)*.11+Math.sin(time*2+id)*.025;ctx.save();ctx.translate(0,-42);ctx.rotate(headTilt)
 ellipse(-5.2,0,1.5,3.3,palette.skinDark);ellipse(5.2,0,1.5,3.3,palette.skinDark)
 ellipse(0,-.5,bulk?6.6:5.7,bulk?7.6:6.8,skin,palette.skinDark,.8)
 poly([[-4.8,1.5],[-3.5,5.5],[0,7],[3.7,5.2],[5,1.2],[2.9,2.4],[0,1.8],[-2.8,2.6]],palette.skinDark,palette.wound,.55)
 ellipse(-2.3,-1.3,1.25,.72,'#33272a');ellipse(2.3,-1.4,1.25,.72,'#33272a');ellipse(-2.2,-1.2,.52,.38,kind==='toxic'?'#d7ec73':'#d58365');ellipse(2.4,-1.3,.52,.38,kind==='toxic'?'#d7ec73':'#d58365')
 poly([[-.7,-.4],[.8,2],[0,2.7],[-1.2,2]],palette.skinDark);ctx.strokeStyle='#2a171b';ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(-2.7,4.1);ctx.quadraticCurveTo(0,6,3,3.9);ctx.stroke();ctx.strokeStyle='#d7c9ae';ctx.lineWidth=.55;for(let tooth=-2;tooth<=2;tooth++){ctx.beginPath();ctx.moveTo(tooth*.9,4.25);ctx.lineTo(tooth*.85,5.05);ctx.stroke()}
 ellipse(variant===0?-3.7:3.6,variant===2?1:-3,variant===1?2.1:1.5,variant===1?2.5:1.8,palette.wound,palette.blood,.6);ellipse(variant===0?-3.8:3.5,variant===2?1:-3,.65,.75,'#171416')
 ctx.fillStyle=variant===1?'#292724':'#353632';ctx.beginPath();ctx.arc(0,-5.6,5.3,Math.PI,Math.PI*2);ctx.lineTo(4,-4.3);ctx.quadraticCurveTo(1,-5,-1,-3.9);ctx.lineTo(-4.8,-4.7);ctx.closePath();ctx.fill()
 if(kind==='armored'){poly([[-7,-5],[6.8,-5.5],[5.8,.5],[-5.7,.5]],'#506570','#1b272e',.8);poly([[-5.5,-3.8],[5.3,-4],[4.8,-1.4],[-5,-1.2]],'#192b33');ctx.strokeStyle='#93b0b7';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-4.6,-2.7);ctx.lineTo(4.3,-2.9);ctx.stroke()}
 if(kind==='toxic'){ellipse(0,2.2,4.2,2.9,'#3c4935','#20291e',.8);ellipse(-1.5,2,.75,.75,'#b9d56a');ellipse(1.3,2,.75,.75,'#b9d56a')}
 if(kind==='boss'){poly([[-6,-5],[-3,-9],[-1,-5],[2,-9],[5,-5]],palette.skinDark,palette.wound,.8);ctx.strokeStyle=palette.blood;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-5,1);ctx.lineTo(-1,4);ctx.moveTo(5,0);ctx.lineTo(2,4);ctx.stroke()}
 ctx.restore()
 ctx.strokeStyle=palette.blood;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-bodyWidth*.12,-34);ctx.lineTo(-bodyWidth*.2,-28);ctx.moveTo(bodyWidth*.34,-26);ctx.lineTo(bodyWidth*.22,-21);ctx.stroke()
 ctx.restore()
}

const ZOMBIE_CACHE_SCALE=2
const ZOMBIE_CACHE=new Map<string,HTMLCanvasElement>()
const zombieKindScale=(kind:ZombieKind)=>kind==='boss'?2.25:kind==='tank'?1.48:kind==='runner'?.94:kind==='armored'?1.08:1
function cachedZombie(kind:ZombieKind,variant:number,frame:number,flash:boolean):HTMLCanvasElement {
 const key=`${kind}-${variant}-${frame}-${flash?1:0}`
 const existing=ZOMBIE_CACHE.get(key);if(existing)return existing
 const kindScale=zombieKindScale(kind),canvas=document.createElement('canvas')
 canvas.width=Math.ceil(72*kindScale*ZOMBIE_CACHE_SCALE);canvas.height=Math.ceil(68*kindScale*ZOMBIE_CACHE_SCALE)
 const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high'
 const speed=kind==='runner'?12:kind==='boss'?4.2:7,time=(frame/4*Math.PI*2-variant*.83)/speed
 renderZombieVector(context,canvas.width/2,canvas.height-6,ZOMBIE_CACHE_SCALE,kind,time,variant,flash)
 ZOMBIE_CACHE.set(key,canvas);return canvas
}
export function zombieSprite(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,kind:ZombieKind,time:number,id:number,flash=false):void {
 const speed=kind==='runner'?12:kind==='boss'?4.2:7,frame=((Math.floor((time*speed+id*.83)/Math.PI*2*4)%4)+4)%4
 const image=cachedZombie(kind,id%3,frame,flash),ratio=s/ZOMBIE_CACHE_SCALE
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,x-image.width*ratio/2,y-(image.height-6)*ratio,image.width*ratio,image.height*ratio);ctx.restore()
}
