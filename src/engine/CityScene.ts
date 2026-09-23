import { clamp } from '@/engine/math'
import type { Vec2 } from '@/types/game'
export interface SceneView {width:number;height:number;scale:number;cameraX:number;cameraY:number}
type Point=readonly[number,number,number?]
type PropKind='building'|'car'|'crate'|'barrier'|'lamp'|'barrel'
export interface CityProp {x:number;y:number;width:number;depth:number;height:number;kind:PropKind;variant:number;image:HTMLCanvasElement;anchorX:number;anchorY:number;sortDepth:number;solid:boolean;district:number;hit:number}
class Painter {
 constructor(readonly ctx:CanvasRenderingContext2D,readonly ox:number,readonly oy:number){}
 x(x:number,y:number){return this.ox+(x-y)*.86} y(x:number,y:number,z=0){return this.oy+(x+y)*.47-z}
 poly(pts:readonly Point[],color:string){const c=this.ctx;c.fillStyle=color;c.beginPath();pts.forEach(([x,y,z],i)=>i?c.lineTo(this.x(x,y),this.y(x,y,z)):c.moveTo(this.x(x,y),this.y(x,y,z)));c.closePath();c.fill()}
 tile(x:number,y:number,w:number,d:number,color:string,z=0){this.poly([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],color)}
 line(a:Point,b:Point,color:string,width=1){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(this.x(a[0],a[1]),this.y(a[0],a[1],a[2]));c.lineTo(this.x(b[0],b[1]),this.y(b[0],b[1],b[2]));c.stroke()}
 box(x:number,y:number,w:number,d:number,h:number,colors:readonly[string,string,string],z=0){const l=x-w/2,r=x+w/2,t=y-d/2,b=y+d/2;this.poly([[l,b,z],[r,b,z],[r,b,z+h],[l,b,z+h]],colors[1]);this.poly([[r,t,z],[r,b,z],[r,b,z+h],[r,t,z+h]],colors[2]);this.tile(l,t,w,d,colors[0],z+h)}
}
const NEON=['#7be7d6','#ffb454','#9aa7ff']
export class CityScene {
 readonly props:CityProp[]=[]
 private grounds:HTMLCanvasElement[]=[]
 private lights:HTMLCanvasElement[]=[]
 constructor(){
  for(let d=0;d<3;d++){
   const offset=d*1200
   for(const [x,y,w,h,z,v] of [[370,375,190,170,125,0],[190,305,135,205,154,1],[838,377,175,180,140,1],[1017,328,130,180,166,0],[376,835,173,183,115,2],[200,965,142,181,144,0],[845,837,181,168,132,0],[1030,987,144,160,170,1]])this.add('building',x!+offset,y!,w!,h!,z!,v!,d)
   for(const [x,y,w,h,v] of [[650,416,35,67,0],[544,825,36,70,1],[380,654,69,35,2],[888,542,68,34,0],[1120,637,35,69,1]])this.add('car',x!+offset,y!,w!,h!,28,v!,d)
   for(const [x,y] of [[478,520],[754,680],[610,973]])this.add('barrier',x!+offset,y!,55,13,20,0,d)
   for(const [x,y] of [[469,453],[444,476],[735,445],[458,756],[753,765]])this.add('crate',x!+offset,y!,23,23,25,0,d)
   for(const [x,y] of [[477,796],[741,474],[749,740]])this.add('barrel',x!+offset,y!,16,16,23,0,d)
   for(const [x,y] of [[478,466],[725,466],[727,728],[478,721],[486,177],[724,1050],[172,482],[1034,725]])this.add('lamp',x!+offset,y!,28,20,87,0,d,false)
   this.grounds.push(this.paintGround(d));this.lights.push(this.glow(NEON[d]!))
  }
  this.props.sort((a,b)=>a.sortDepth-b.sortDepth)
 }
 private glow(color:string){const c=document.createElement('canvas');c.width=160;c.height=96;const ctx=c.getContext('2d')!;const g=ctx.createRadialGradient(80,48,2,80,48,78);g.addColorStop(0,color+'48');g.addColorStop(.4,color+'19');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(0,0,160,96);return c}
 private add(kind:PropKind,x:number,y:number,width:number,depth:number,height:number,variant:number,district:number,solid=true){const image=document.createElement('canvas');image.width=Math.ceil((width+depth)*.86)+80;image.height=Math.ceil((width+depth)*.47+height)+80;const prop:CityProp={x,y,width,depth,height,kind,variant,district,solid,image,anchorX:image.width/2,anchorY:height+(width+depth)*.235+40,sortDepth:x+y+(kind==='building'?(width+depth)*.21:0),hit:0};const p=new Painter(image.getContext('2d')!,prop.anchorX,prop.anchorY);this.paintProp(p,prop);this.props.push(prop)}
 private paintGround(d:number){const canvas=document.createElement('canvas');canvas.width=2200;canvas.height=1360;const ctx=canvas.getContext('2d')!;const p=new Painter(ctx,1100,100);const ground=['#35404b','#484044','#3a3d52'][d]!;p.tile(0,0,1200,1200,ground)
  let seed=9142+d*999;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647}
  for(let x=0;x<1200;x+=40)for(let y=0;y<1200;y+=40){p.tile(x+1,y+1,38,38,random()>.6?'#81959b14':'#111e241b');p.line([x+3,y+3],[x+35,y+3],'#c9d4d713',.7)}
  p.tile(490,0,220,1200,'#869197');p.tile(0,490,1200,220,'#869197');p.tile(497,0,206,1200,'#172532');p.tile(0,497,1200,206,'#172532');p.tile(504,0,192,1200,'#283340');p.tile(0,504,1200,192,'#283340')
  for(let i=15;i<1200;i+=60){if(i>462&&i<715)continue;p.tile(597,i,3,28,'#d3b77e88');p.tile(603,i,3,28,'#d3b77e55');p.tile(i,597,28,3,'#d3b77e88');p.tile(i,603,28,3,'#d3b77e55')}
  for(let i=515;i<687;i+=23)for(const crossing of [470,707]){p.tile(i,crossing,12,28,'#c4c8bd88');p.tile(crossing,i,28,12,'#c4c8bd88')}
  for(let i=0;i<2200;i++){const x=random()*1200,y=random()*1200;p.tile(x,y,random()*3+1,random()*2+1,random()>.7?'#b5b5a91c':'#07162035')}
  for(let i=0;i<80;i++){const x=random()*1180,y=random()*1180;p.poly([[x,y],[x+30,y+4],[x+45,y+15],[x+10,y+23],[x-8,y+10]],'#0715214f');p.line([x,y+6],[x+22,y+9],NEON[d]!+'25',1)}
  ctx.save();ctx.translate(p.x(600,780),p.y(600,780));ctx.transform(.86,.47,-.86,.47,0,0);ctx.font='700 24px sans-serif';ctx.textAlign='center';ctx.fillStyle='#c9ccd24c';ctx.fillText(['LAS JACARANDAS','AVENIDA CENTRAL','PUERTO CENIZA'][d]!,0,0);ctx.restore();return canvas
 }
 private paintProp(p:Painter,a:CityProp){const {kind,width:w,depth:d,height:h,variant:v,district:k}=a;const c=p.ctx
  if(kind==='building'){
   const colors:readonly[string,string,string]=k===0?(v===1?['#657983','#526978','#3b5264']:['#7c6d6a','#6d5a57','#4d4851']):k===1?(v===1?['#7f6861','#8a6558','#57444b']:['#677a81','#516675','#39495d']):['#656f8d','#515b78','#393f5c']
   p.box(0,0,w+7,d+7,6,['#879195','#626d77','#434e61']);p.box(0,0,w,d,h,colors,6)
   for(let z=10;z<h;z+=9){p.line([-w/2,d/2+.1,z],[w/2,d/2+.1,z],'#111c2b44',.7);p.line([w/2+.1,-d/2,z],[w/2+.1,d/2,z],'#111c2b44',.7);for(let x=-w/2+(z%18?0:9);x<w/2;x+=18)p.line([x,d/2+.2,z],[x,d/2+.2,z+8],'#1b263738',.6)}
   for(let z=38;z<h-6;z+=37)p.box(0,0,w+3,d+3,2,['#92979b','#7c818a','#52596d'],z)
   for(let f=0;f<Math.floor((h-18)/37);f++){const z=20+f*37;for(let col=0;col<Math.floor((w-16)/29);col++){const x=-w/2+13+col*29,lit=(f*5+col*3+v)%4===0;p.poly([[x-2,d/2+1,z-2],[x+15,d/2+1,z-2],[x+15,d/2+1,z+22],[x-2,d/2+1,z+22]],'#99a1a2');p.poly([[x,d/2+2,z],[x+13,d/2+2,z],[x+13,d/2+2,z+20],[x,d/2+2,z+20]],lit?(k===2?'#a5b6e4':'#e9bd7f'):'#183341');p.line([x+6,d/2+2.5,z],[x+6,d/2+2.5,z+20],'#3d4d5a',2);p.line([x,d/2+2.5,z+9],[x+13,d/2+2.5,z+9],'#3d4d5a',1.5);p.box(x+6,d/2+3,19,5,2,['#a0a49e','#77818b','#565e73'],z-4)}
   for(let col=0;col<Math.floor((d-16)/31);col++){const y=-d/2+13+col*31;p.poly([[w/2+1,y,z],[w/2+1,y+13,z],[w/2+1,y+13,z+20],[w/2+1,y,z+20]],(col+f)%4===0?'#acaca0':'#182c3f');p.line([w/2+2,y+6,z],[w/2+2,y+6,z+20],'#526070',2)}}
   p.box(0,0,w+5,d+5,5,['#a1a6a6','#7b8490','#586476'],h+6);p.tile(-w/2+7,-d/2+7,w-14,d-14,'#394959',h+11)
   for(const [x,y,ww,dd] of [[-w/2+5,0,5,d],[0,-d/2+5,w,5],[w/2-5,0,5,d],[0,d/2-5,w,5]])p.box(x!,y!,ww!,dd!,7,['#97a4a6','#647786','#4b6177'],h+11)
   p.box(-22,-8,32,27,15,['#8f989b','#637683','#415665'],h+11);for(let i=0;i<5;i++)p.line([-36+i*5,7,h+15],[-36+i*5,7,h+23],'#243847',2);p.box(28,-32,13,15,19,['#929299','#637180','#3e5067'],h+11)
   if(k===2){for(let i=0;i<3;i++)p.box(-w/2-5,0+i*16,8,12,h*.55,['#8a8eac','#5d6482','#444762'])}
   p.poly([[-14,d/2+3,6],[7,d/2+3,6],[7,d/2+3,32],[-14,d/2+3,32]],'#0c2235');p.box(-3,d/2+6,29,10,4,['#949993','#607581','#435a70'],1)
   p.poly([[-41,d/2+3,34],[42,d/2+3,34],[42,d/2+3,49],[-41,d/2+3,49]],'#162733')
   c.save();c.translate(p.x(-34,d/2+4),p.y(-34,d/2+4,38));c.transform(.86,.47,0,-1,0,0);c.scale(1,-1);c.font='bold 9px monospace';c.fillStyle=NEON[k]!;c.fillText(k===0?(v===1?'FARMACIA':'RESIDENCIA'):k===1?(v===1?'CAFÉ NOCHE':'MERCADO 24'):'ALMACÉN 09',0,0);c.restore()
   p.line([-40,d/2+4,35],[40,d/2+4,35],NEON[k]!,1.6)
   if(k===1){for(let n=0;n<8;n++)p.tile(-40+n*10,d/2+4,10,15,n%2?'#c59a74':'#5c6673',32)}
  }else if(kind==='car'){
   const colors:readonly[string,string,string]=v===0?['#6699a4','#3e707e','#29515f']:v===1?['#bb8c65','#8f644f','#674857']:['#b36b6b','#8c4f5a','#5a3b51']
   for(const x of [-w*.4,w*.4])for(const y of [-d*.33,d*.33])p.box(x,y,8,11,9,['#313c4b','#121b25','#111723'])
   p.box(0,0,w,d,10,colors,6);const cw=d>w?w-6:w*.42,cd=d>w?d*.42:d-6;p.box(0,-3,cw,cd,13,['#7d9cad','#315261','#263e56'],16);p.tile(-cw/2+2,-cd/2-1,cw-4,cd-4,colors[0],30);p.line([-cw/2,cd/2,22],[cw/2,cd/2,22],'#87bdca',1.4);p.box(0,d/2+1,w+3,3,4,['#b0b7b7','#718695','#435a70'],4);for(const x of [-w*.3,w*.3])p.box(x,d/2+2,6,2,3,['#e8c993','#e5c180','#9e9476'],11);if(v===2){p.box(-4,0,8,8,3,['#ff727b','#bd4260','#643859'],30);p.box(4,0,8,8,3,['#79bfff','#326fba','#264a81'],30)}
  }else if(kind==='lamp'){p.box(0,0,8,8,5,['#919ba3','#576e82','#344a60']);p.box(0,0,3,3,79,['#9cadbb','#6d8297','#3c546c'],5);p.line([0,0,84],[16,0,89],'#8899a8',3);p.box(17,0,12,6,4,['#8a9da4','#526b80','#3c5169'],84);p.tile(12,-2,9,4,'#ffe2a4',84)
  }else if(kind==='barrier'){p.box(0,0,w+5,d+5,5,['#bbb0a1','#8e8a86','#5e6b78']);p.box(0,0,w,d,h,['#c1a773','#b09971','#746b65'],4);for(let x=-w/2;x<w/2-8;x+=16)p.poly([[x,d/2+1,7],[x+7,d/2+1,7],[Math.min(w/2,x+15),d/2+1,h],[x+8,d/2+1,h]],'#273a4b')
  }else if(kind==='crate'){p.box(0,0,w,d,h,['#9c8365','#806950','#5d5050']);p.box(0,0,w+2,d+2,3,['#ba9c76','#9c8164','#756357'],h-3);p.line([-w/2+3,d/2+1,3],[w/2-3,d/2+1,h-5],'#cead84',2);p.line([w/2+1,-d/2+3,2],[w/2+1,d/2-3,h-3],'#9d8e79',2)
  }else{c.fillStyle='#5d7f88';c.fillRect(p.ox-8,p.oy-23,16,23);c.fillStyle='#94a9ad';c.beginPath();c.ellipse(p.ox,p.oy-23,8,4,0,0,Math.PI*2);c.fill();c.fillStyle='#263f52';c.fillRect(p.ox-8,p.oy-17,16,2);c.fillRect(p.ox-8,p.oy-6,16,2);c.fillStyle='#ffb454';c.fillRect(p.ox-2,p.oy-14,5,5)}
 }
 drawGround(ctx:CanvasRenderingContext2D,v:SceneView){for(let i=0;i<3;i++){const x=v.width/2+(i*1200-v.cameraX+v.cameraY)*.86*v.scale-1100*v.scale;const y=v.height/2+(i*1200-v.cameraX-v.cameraY)*.47*v.scale-100*v.scale;const w=2200*v.scale,h=1360*v.scale;if(x>v.width||x+w<0||y>v.height||y+h<0)continue;ctx.drawImage(this.grounds[i]!,Math.round(x),Math.round(y),Math.round(w),Math.round(h))}}
 drawProp(ctx:CanvasRenderingContext2D,p:CityProp,v:SceneView,player:Vec2){const x=v.width/2+(p.x-v.cameraX-p.y+v.cameraY)*.86*v.scale;const y=v.height/2+(p.x-v.cameraX+p.y-v.cameraY)*.47*v.scale;const l=x-p.anchorX*v.scale,t=y-p.anchorY*v.scale,w=p.image.width*v.scale,h=p.image.height*v.scale;if(l>v.width||l+w<0||t>v.height||t+h<0)return;const px=v.width/2+(player.x-v.cameraX-player.y+v.cameraY)*.86*v.scale,py=v.height/2+(player.x-v.cameraX+player.y-v.cameraY)*.47*v.scale;const obscured=p.kind==='building'&&player.x+player.y<p.sortDepth&&px>l+30*v.scale&&px<l+w-30*v.scale&&py>t+20*v.scale&&py<t+h-30*v.scale;ctx.globalAlpha=obscured?.3:1;ctx.drawImage(p.image,Math.round(l+(p.hit>0?Math.sin(p.hit*100)*2:0)),Math.round(t),w,h);ctx.globalAlpha=1}
 drawShadows(ctx:CanvasRenderingContext2D,v:SceneView){ctx.fillStyle='#060e1848';for(const p of this.props){const x=v.width/2+(p.x-v.cameraX-p.y+v.cameraY)*.86*v.scale,y=v.height/2+(p.x-v.cameraX+p.y-v.cameraY)*.47*v.scale;if(x<-230||x>v.width+230||y< -100||y>v.height+230)continue;ctx.beginPath();ctx.ellipse(x+p.height*.25*v.scale,y+p.height*.1*v.scale,(p.width+p.depth)*.38*v.scale,Math.max(4,p.depth*.23)*v.scale,.1,0,Math.PI*2);ctx.fill()}}
 drawPlayerLight(ctx:CanvasRenderingContext2D,v:SceneView,p:Vec2){const x=v.width/2+(p.x-v.cameraX-p.y+v.cameraY)*.86*v.scale,y=v.height/2+(p.x-v.cameraX+p.y-v.cameraY)*.47*v.scale;ctx.drawImage(this.lights[0]!,x-80*v.scale,y-48*v.scale,160*v.scale,96*v.scale)}
 drawAmbient(ctx:CanvasRenderingContext2D,v:SceneView,time:number,reduced:boolean,lighting:boolean,particles:number){for(const p of this.props){const x=v.width/2+(p.x-v.cameraX-p.y+v.cameraY)*.86*v.scale,y=v.height/2+(p.x-v.cameraX+p.y-v.cameraY)*.47*v.scale;if(x< -100||x>v.width+100||y< -80||y>v.height+230)continue
   if(p.kind==='lamp'&&lighting){const flicker=reduced?1:Math.sin(time*9+p.x)*Math.sin(time*17+p.y)>.5?.3:1;ctx.globalAlpha=flicker;ctx.drawImage(this.lights[p.district]!,x-70*v.scale,y-40*v.scale,160*v.scale,96*v.scale);ctx.fillStyle='#ffdeaa';ctx.fillRect(x+12*v.scale,y-79*v.scale,6*v.scale,2*v.scale);if(flicker<1&&particles>0){ctx.fillStyle='#ffd08a';for(let n=0;n<4;n++)ctx.fillRect(x+(10+Math.sin(time*20+n)*12)*v.scale,y-(70-n*6)*v.scale,v.scale,2*v.scale)}ctx.globalAlpha=1}
   if(p.kind==='car'&&p.variant===2&&lighting){ctx.globalAlpha=reduced?.3:.25+Math.sin(time*5)*.15;ctx.fillStyle=Math.sin(time*4)>0?'#ff5479':'#65b4ff';ctx.beginPath();ctx.ellipse(x,y,43*v.scale,20*v.scale,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
   if(p.kind==='building'&&p.district===2&&particles>0){for(let n=0;n<3;n++){const drift=(time*12+n*19)%60;ctx.fillStyle='#96a6bf10';ctx.beginPath();ctx.ellipse(x+18*v.scale+drift*.3*v.scale,y-(p.height+drift)*v.scale,(8+drift*.2)*v.scale,(5+drift*.16)*v.scale,0,0,Math.PI*2);ctx.fill()}}
  }}
 drawRain(ctx:CanvasRenderingContext2D,v:SceneView,t:number,amount=40){ctx.strokeStyle='#b6d4e51c';ctx.lineWidth=.6;ctx.beginPath();for(let i=0;i<amount;i++){const x=((i*137.37+t*29)%(v.width+40))-20,y=((i*79.53+t*240)%(v.height+30))-15;ctx.moveTo(x,y);ctx.lineTo(x-3,y+9)}ctx.stroke()}
 hitObject(x:number,y:number):CityProp|undefined{return this.props.find(p=>p.solid&&Math.abs(x-p.x)<p.width/2&&Math.abs(y-p.y)<p.depth/2)}
 tick(dt:number){for(const p of this.props)p.hit=Math.max(0,p.hit-dt)}
 resolve(e:Vec2,radius:number,target?:Vec2,step=0){for(const p of this.props){if(!p.solid||Math.abs(e.x-p.x)>p.width/2+radius||Math.abs(e.y-p.y)>p.depth/2+radius)continue;const l=p.x-p.width/2,r=p.x+p.width/2,t=p.y-p.depth/2,b=p.y+p.depth/2;let dx=e.x-clamp(e.x,l,r),dy=e.y-clamp(e.y,t,b);const sq=dx*dx+dy*dy;if(sq>=radius*radius)continue;if(sq===0){const sides=[e.x-l,r-e.x,e.y-t,b-e.y],nearest=Math.min(...sides);if(sides[0]===nearest){e.x=l-radius;dx=-1}else if(sides[1]===nearest){e.x=r+radius;dx=1}else if(sides[2]===nearest){e.y=t-radius;dy=-1}else{e.y=b+radius;dy=1}}else{const len=Math.sqrt(sq);dx/=len;dy/=len;e.x+=dx*(radius-len+.1);e.y+=dy*(radius-len+.1)}if(target&&step>0){if(Math.abs(dx)>Math.abs(dy))e.y+=(target.y>t&&target.y<b?(e.y<p.y?-1:1):Math.sign(target.y-e.y))*step;else e.x+=(target.x>l&&target.x<r?(e.x<p.x?-1:1):Math.sign(target.x-e.x))*step}}
 e.x=clamp(e.x,radius,3600-radius);e.y=clamp(e.y,radius,1200-radius)}
}
