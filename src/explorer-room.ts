import * as T from 'three';
import {ExplorerGeometry} from './explorer-geometry';
import {wardrobeBlocks} from './wardrobe';

/** A quiet dressing room; all furniture is decorative and batched into one draw. */
export function explorerRoom(){
 const g=new ExplorerGeometry(),b=g.box.bind(g),wood=0x9d7958,cream=0xeee2c8,olive=0x7f9167;
 b(0,-.07,0,4.8,.12,4,0xcdb494);b(0,1.2,-1.45,4.8,2.5,.12,cream);
 b(-2.35,1.2,0,.12,2.5,3,0xd8d8bd);b(2.35,1.2,0,.12,2.5,3,0xe4ddc3);
 for(let i=-4;i<=4;i++)b(i*.52,-.005,0,.012,.015,3.9,0xb79876);
 // A rug anchors the body without attaching a pedestal to the character.
 b(0,.005,.1,1.65,.025,1.5,olive);b(0,.021,.1,1.48,.008,1.3,0xb7bd94);
 for(const p of wardrobeBlocks())b(-1.35+p.x*.65,p.y*.65,-.65+p.z*.65,p.w*.65,p.h*.65,p.d*.65,p.c,p.roll??0,p.angle??0);
 // Stool and a small folded stack.
 b(1.4,.35,-.5,.6,.12,.55,wood);for(const x of [1.2,1.6])for(const z of [-.7,-.3])b(x,.16,z,.08,.3,.08,wood);
 for(let i=0;i<3;i++)b(1.4,.45+i*.08,-.5,.42,.07,.36,[0xc4cb9b,0xe7cf9e,0x819fa0][i]);
 // Clothes rail, three chunky shirts and a shelf with a hat.
 for(const x of [.7,1.95])b(x,.65,-1.05,.05,1.3,.08,wood);
 b(1.32,1.3,-1.05,1.3,.05,.08,wood);
 for(let i=0;i<3;i++){const x=.92+i*.35;b(x,1.05,-1.05,.29,.34,.1,[olive,0xbc8b6d,0x7c9d9f][i]);b(x,1.19,-1.05,.42,.09,.12,[olive,0xbc8b6d,0x7c9d9f][i]);}
 b(1.6,1.75,-1.1,1.15,.08,.5,wood);b(1.55,1.83,-1.05,.48,.06,.35,0xd3bd84);b(1.55,1.93,-1.1,.3,.17,.25,0xd3bd84);
 // Window / daylight, exploration map, framed print and wall compass.
 b(-.25,1.65,-1.36,1.1,.88,.12,wood);b(-.25,1.65,-1.28,.94,.73,.08,0xb9d9d3);
 b(-.25,1.65,-1.22,.05,.78,.04,cream);b(-.25,1.65,-1.22,1,.05,.04,cream);
 b(.4,.83,-1.35,.62,.48,.07,0xe8d7ac);b(.35,.85,-1.3,.18,.23,.02,olive,-.3);b(.57,.71,-1.3,.17,.11,.02,0x8babaa);
 b(-1.65,1.85,-1.35,.47,.38,.1,wood);b(-1.65,1.85,-1.28,.35,.27,.03,0x96af95);
 b(.62,1.83,-1.32,.32,.32,.09,0xb79b5e);b(.62,1.83,-1.25,.23,.23,.04,cream);b(.62,1.83,-1.21,.045,.2,.02,0x8a5a4e,-.5);
 // Backpack, trunk, lantern, boots, plant and crate stay in the periphery.
 b(1.85,.27,.15,.4,.5,.2,olive);b(1.85,.48,.25,.42,.08,.12,0xabb78c);b(1.85,.29,.3,.26,.18,.08,0xc8bb8b);
 b(-1.5,.18,.65,.64,.34,.42,0xb79370);for(const x of [-1.72,-1.28])b(x,.2,.87,.05,.36,.02,cream);
 for(const x of [.9,1.15]){b(x,.085,.85,.16,.14,.31,0x77634e);b(x,.2,.78,.16,.17,.17,0x9a825d);}
 b(1.85,.14,.88,.42,.28,.38,wood);b(1.85,.31,.88,.46,.07,.42,0xb89367);
 b(1.85,.49,.88,.2,.26,.2,0xefcf8a);b(1.85,.64,.88,.27,.05,.27,olive);b(1.85,.71,.88,.04,.14,.05,olive);
 b(-1.9,.16,1.15,.3,.3,.3,0xb58566);b(-1.9,.44,1.15,.07,.36,.07,olive);
 for(const s of [-1,1])b(-1.9+s*.11,.48+s*.05,1.15,.25,.11,.18,0x91aa77,s*.4);
 const mesh=new T.Mesh(g.finish(),new T.MeshLambertMaterial({vertexColors:true}));mesh.name='explorer-preparation-room';return mesh;
}
