// Stable room slots: public paths, privately operated farm and treadmill.
export const FARM_PLOTS = [
  {x:-8,z:2},{x:8,z:2},{x:-8,z:12},{x:8,z:12},{x:0,z:20},
] as const;
export const farmPlot=(slot:number)=>FARM_PLOTS[slot]??FARM_PLOTS[0];
export const farmGym=(slot:number)=>{const p=farmPlot(slot);return {x:p.x+2,z:p.z-1};};
export const villageColliders=()=>[...FARM_PLOTS.flatMap(p=>[
  {minX:p.x-3.8,maxX:p.x-1.2,minZ:p.z-1.8,maxZ:p.z+.6},
  {minX:p.x+1.35,maxX:p.x+2.65,minZ:p.z-1.8,maxZ:p.z-1.6},
  {minX:p.x-2.4,maxX:p.x-1.6,minZ:p.z+2.1,maxZ:p.z+2.9},
  ...[-3.5,0,3.5].map(dx=>({minX:p.x+dx-.7,maxX:p.x+dx+.7,minZ:p.z+3.4,maxZ:p.z+3.6})),
]),
 {minX:-5.4,maxX:-3.6,minZ:3.1,maxZ:4.9},
 {minX:-.7,maxX:.7,minZ:9.3,maxZ:10.7},
 ...[-1,1].map(side=>({minX:side*1.9-.25,maxX:side*1.9+.25,minZ:-5.1,maxZ:-4.5})),
];
