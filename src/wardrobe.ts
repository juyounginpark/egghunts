import type {Block} from './region-layout';
export const WARDROBE={x:4.8,z:-1.8,rotation:-Math.PI/2,reach:1.8};
export function wardrobeBlocks():Block[]{
 const out:Block[]=[],wood=0x977451,cream=0xe6d5ac;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,angle=0)=>out.push({x,y,z,w,h,d,c,angle});
 // An actual open cabinet: side walls, recessed back and spaced shelves.
 b(.35,.6,-.26,1.2,1.04,.08,0x786044);
 for(const x of [-.21,.91])b(x,.6,0,.08,1.04,.6,wood);
 for(const y of [.12,.56,1.08])b(.35,y,0,1.2,.08,.6,wood);
 for(let i=0;i<2;i++)b(.08,.24+i*.13,.03,.4,.11,.4,[cream,0x8da079][i]);
 b(.42,.71,.03,.7,.18,.42,0x7f9c9b);b(.42,.85,.03,.56,.1,.36,cream);
 b(.91,.6,.52,.09,.95,.55,0xaf8d67,.38);b(.76,.6,.72,.07,.1,.07,cream);
 b(.35,1.12,0,1.38,.08,.72,wood);b(.35,1.63,0,1.38,.08,.5,wood);
 for(const x of [-.25,.95])b(x,1.35,0,.06,.55,.06,wood);
 b(.35,1.49,0,.95,.045,.05,cream);b(.3,1.34,.05,.5,.25,.1,0x8ca17b);
 for(const x of [0,.65]){b(x,1.71,0,.47,.06,.4,0xb6ad77);b(x,1.81,0,.3,.16,.3,0xb6ad77);}
 // Bright blue mirror instead of an expensive second world render.
 b(-.85,1,0,.7,1.9,.15,wood);b(-.85,1,.095,.56,1.67,.04,0xb5d6d1);
 b(-.85,.9,.13,.12,1.2,.015,0xd7e9db,-.18);b(-.85,.08,.08,.9,.12,.55,wood);
 b(-.85,2.03,0,.28,.09,.13,0xd6b464);b(-.85,2.13,0,.09,.11,.13,0xd6b464);b(-.85,1.93,0,.09,.11,.13,0xd6b464);
 b(0,.025,.75,2.25,.035,.8,0x96a37b);
 return out;
}
export function villageWardrobeBlocks(){
 const c=Math.cos(WARDROBE.rotation),s=Math.sin(WARDROBE.rotation);
 return wardrobeBlocks().map(p=>({...p,x:WARDROBE.x+p.x*c+p.z*s,z:WARDROBE.z-p.x*s+p.z*c,angle:(p.angle??0)+WARDROBE.rotation}));
}
