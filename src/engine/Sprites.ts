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
export const ZOMBIE_COLORS:Record<ZombieKind,string>={walker:'#927b86',runner:'#bb674c',tank:'#776490',armored:'#5c8194',toxic:'#7b9f55',boss:'#b65255'}
export function zombieSprite(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,kind:ZombieKind,time:number,id:number,flash=false):void {
 const size=s*(kind==='boss'?2.3:kind==='tank'?1.5:kind==='runner'?.9:1);ctx.save();ctx.translate(x,y);ctx.scale(size,size)
 const r=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 const step=Math.sin(time*(kind==='runner'?16:8)+id)*2;const coat=flash?'#eee3d0':ZOMBIE_COLORS[kind];const skin=kind==='toxic'?'#b7c779':kind==='boss'?'#c49085':id%2?'#ada598':'#8d9c9c'
 r(-6,-12+step,5,11,'#3e414b');r(2,-12-step,5,11,'#303e49');r(-7,-2+step,6,3,'#20262c');r(2,-2-step,7,3,'#20262c');r(-8,-27,16,16,coat);r(-7,-26,3,12,'#dad6d333');r(-11,-25,4,12,coat);r(8,-25,4,11,coat);r(-11,-16,4,7,skin);r(9,-16,4,7,skin);r(-5,-39,11,12,skin);r(-6,-39,10,4,'#38424a');r(-3,-33,2,2,'#ffb454');r(3,-33,2,2,'#ffb454');r(-2,-29,5,2,'#583f46')
 if(kind==='armored'){r(-7,-27,14,11,'#344d60');r(-6,-40,13,5,'#627e8e');r(-3,-26,3,9,'#95a6ae')}
 if(kind==='toxic'){r(-11,-29,4,13,'#94c876');r(-2,-24,5,5,'#d0ec76')}
 if(kind==='tank'||kind==='boss'){r(-12,-28,7,9,coat);r(7,-28,7,9,coat);r(-8,-14,16,3,'#262f3e');r(-3,-26,6,2,'#dba092')}
 ctx.restore()
}
