import type {Block} from './region-layout';
export const WARDROBE={x:4.8,z:-1.8,rotation:-Math.PI/2,reach:1.8};
export function wardrobeBlocks():Block[]{
 const out:Block[]=[],wood=0x977451,cream=0xe6d5ac;
 const b=(x:number,y:number,z:number,w:number,h:number,d:number,c:number,angle=0)=>out.push({x,y,z,w,h,d,c,angle});
 b(.35,.55,0,1.2,1.1,.6,wood);b(.35,.55,.32,1.02,.92,.04,0x65523f);
 for(let i=0;i<3;i++)b(.15,.23+i*.13,.33,.48,.1,.3,[cream,0x8da079,0x7f9c9b][i]);
 b(.82,.6,.54,.48,1,.08,0xaf8d67,.42);b(.65,.6,.71,.06,.09,.06,cream);
 b(.35,1.12,0,1.38,.08,.72,wood);b(.35,1.63,0,1.38,.08,.5,wood);
 for(const x of [-.25,.95])b(x,1.35,0,.06,.55,.06,wood);
 b(.35,1.49,0,.95,.045,.05,cream);b(.3,1.34,.05,.5,.25,.1,0x8ca17b);
 for(const x of [0,.65]){b(x,1.71,0,.47,.06,.4,0xb6ad77);b(x,1.81,0,.3,.16,.3,0xb6ad77);}
 // Bright blue mirror instead of an expensive second world render.
 b(-.85,1,0,.7,1.9,.15,wood);b(-.85,1,.095,.56,1.67,.04,0xb5d6d1);
 b(-.85,.9,.13,.12,1.2,.015,0xd7e9db,-.18);b(-.85,.08,.08,.9,.12,.55,wood);
 b(-.85,2.03,0,.28,.1,.13,0xd6b464);b(-.85,2.03,0,.1,.28,.13,0xd6b464);
 b(0,.025,.75,2.25,.035,.8,0x96a37b);
 return out;
}
export function villageWardrobeBlocks(){
 const c=Math.cos(WARDROBE.rotation),s=Math.sin(WARDROBE.rotation);
 return wardrobeBlocks().map(p=>({...p,x:WARDROBE.x+p.x*c+p.z*s,z:WARDROBE.z-p.x*s+p.z*c,angle:(p.angle??0)+WARDROBE.rotation}));
}
